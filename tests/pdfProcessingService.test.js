import { jest } from '@jest/globals';
import {
  extractTextFromPdf,
  extractKeyDetailsForAI,
  buildAiSummaryPrompt,
  summarizeSchemeDocumentWithAI,
  processSchemeDocumentPdf
} from '../services/pdfProcessingService.js';

describe('PDF Health Scheme Document Processing Utility', () => {

  describe('extractKeyDetailsForAI', () => {
    test('should extract key details from an Andhra Pradesh Aarogyasri document text', () => {
      const mockText = `
        GOVERNMENT OF ANDHRA PRADESH
        Dr. YSR Aarogyasri Health Scheme Guidelines 2024
        The scheme provides comprehensive cashless hospitalization care for tertiary ailments.
        Coverage limit is up to ₹25,00,000 per family per annum.
        Eligibility: Families holding a BPL White Ration Card or Rice Card and valid Aadhaar Card.
        Required Documents: Aadhaar Card, Rice Card, and Doctor Prescription / Medical Records.
        Application: Beneficiaries can register at nearest Grama Sachivalayam or meet Aarogyamitra at empanelled network hospitals.
      `;

      const details = extractKeyDetailsForAI(mockText, 'dr_ysr_aarogyasri_guidelines.pdf');

      expect(details.candidateTitle).toMatch(/Aarogyasri/i);
      expect(details.level).toBe('State Government (Andhra Pradesh)');
      expect(details.category).toBe('Hospitalization Care');
      expect(details.benefitAmount).toContain('25,00,000');
      expect(details.benefitAmountTe).toContain('25,00,000');
      
      const docNames = details.detectedDocuments.map(d => d.name);
      expect(docNames).toContain('Aadhaar Card');
      expect(docNames).toContain('White Ration Card / Rice Card');
      expect(docNames).toContain('Doctor Prescription / Medical Records');

      expect(details.applicationPoints.some(p => p.includes('Sachivalayam'))).toBe(true);
      expect(details.applicationPoints.some(p => p.includes('Aarogyamitra'))).toBe(true);
    });

    test('should extract Central Government level and Maternal category correctly', () => {
      const mockText = `
        Government of India - National Health Mission (NHM)
        Pradhan Mantri Matru Vandana Yojana (PMMVY)
        A conditional cash transfer maternity benefit scheme for pregnant women and lactating mothers.
        Provides financial assistance of ₹5,000 in installments.
        Required Documents: Aadhaar Card, Mother and Child Protection Card, Bank account passbook with IFSC.
        Apply at Primary Health Centre (PHC) or Anganwadi Centre.
      `;

      const details = extractKeyDetailsForAI(mockText, 'pmmvy_central.pdf');

      expect(details.level).toBe('Central Government');
      expect(details.category).toBe('Maternal & Child Health');
      expect(details.benefitAmount).toContain('5,000');
      expect(details.detectedDocuments.some(d => d.name.includes('Bank'))).toBe(true);
      expect(details.applicationPoints.some(p => p.includes('Primary Health Centre'))).toBe(true);
    });

    test('should provide sensible defaults for unstructured or sparse text', () => {
      const details = extractKeyDetailsForAI('', 'custom_welfare_doc.pdf');

      expect(details.candidateTitle).toBe('Custom Welfare Doc');
      expect(details.level).toBe('State Government (Andhra Pradesh)');
      expect(details.category).toBe('General Healthcare');
      expect(details.detectedDocuments.length).toBeGreaterThan(0);
      expect(details.applicationPoints.length).toBeGreaterThan(0);
    });
  });

  describe('buildAiSummaryPrompt', () => {
    test('should construct a comprehensive prompt with JSON schema constraints', () => {
      const mockDetails = {
        candidateTitle: 'YSR Aarogya Asara',
        level: 'State Government (Andhra Pradesh)',
        category: 'Hospitalization Care',
        benefitAmount: '₹5,000 post-operative allowance',
        benefitAmountTe: 'రూ. 5,000 శస్త్రచికిత్స అనంతరం భృతి',
        extractedSnippet: 'Post-operative subsistence allowance of ₹225 per day up to ₹5,000.'
      };

      const prompt = buildAiSummaryPrompt(mockDetails);

      expect(prompt).toContain('SmartGovAI');
      expect(prompt).toContain('YSR Aarogya Asara');
      expect(prompt).toContain('simplified');
      expect(prompt).toContain('telugu');
      expect(prompt).toContain('"scheme_name"');
      expect(prompt).toContain('"required_documents"');
    });
  });

  describe('summarizeSchemeDocumentWithAI', () => {
    test('should use grounded fallback when AI client is not provided', async () => {
      const mockDetails = {
        candidateTitle: 'AP Free Dialysis Scheme',
        level: 'State Government (Andhra Pradesh)',
        category: 'Specialized Medical Care (Dialysis/CKD)',
        benefitAmount: '₹10,000 per month pension',
        benefitAmountTe: 'నెలకు రూ. 10,000 పెన్షన్',
        detectedDocuments: [{ name: 'Aadhaar Card', name_te: 'ఆధార్ కార్డు', optional: false }],
        applicationPoints: ['Grama Sachivalayam']
      };

      const summary = await summarizeSchemeDocumentWithAI(mockDetails, null);

      expect(summary.is_ai_generated).toBe(false);
      expect(summary.scheme_name).toBe('AP Free Dialysis Scheme');
      expect(summary.category).toBe('Specialized Medical Care (Dialysis/CKD)');
      expect(summary.simplified.benefits).toContain('10,000');
      expect(summary.telugu.benefits).toContain('10,000');
      expect(summary.required_documents.length).toBe(1);
    });

    test('should parse valid AI response when AI client succeeds', async () => {
      const mockDetails = {
        candidateTitle: 'Dr. YSR Kanti Velugu',
        level: 'State Government (Andhra Pradesh)',
        category: 'Eye Care & Vision',
        benefitAmount: 'Free Eye Screening & Spectacles',
        benefitAmountTe: 'ఉచిత కంటి పరీక్షలు & కళ్లద్దాలు',
        detectedDocuments: [{ name: 'Aadhaar Card', name_te: 'ఆధార్ కార్డు', optional: false }],
        applicationPoints: ['PHC']
      };

      const mockAiClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({
              scheme_name: 'Dr. YSR Kanti Velugu Scheme',
              telugu_name: 'డాక్టర్ వైఎస్సార్ కంటి వెలుగు పథకం',
              category: 'Eye Care & Vision',
              level: 'State Government (Andhra Pradesh)',
              benefitAmount: 'Free Eye Surgery & Spectacles',
              simplified: {
                eligibility: 'All citizens of AP needing eye care.',
                benefits: 'Free universal eye screenings and cataract surgeries.',
                documents: 'Aadhaar Card',
                steps: 'Attend village eye camp or nearest PHC.'
              },
              telugu: {
                eligibility: 'ఆంధ్రప్రదేశ్ ప్రజలందరికీ ఉచిత కంటి వైద్యం.',
                benefits: 'ఉచిత కంటి పరీక్షలు, ఆపరేషన్లు మరియు కళ్లద్దాల పంపిణీ.',
                documents: 'ఆధార్ కార్డు',
                steps: 'గ్రామ కంటి వైద్య శిబిరానికి వెళ్లండి.'
              },
              required_documents: [{ name: 'Aadhaar Card', name_te: 'ఆధార్ కార్డు', optional: false }]
            })
          })
        }
      };

      const summary = await summarizeSchemeDocumentWithAI(mockDetails, mockAiClient);

      expect(summary.is_ai_generated).toBe(true);
      expect(summary.scheme_name).toBe('Dr. YSR Kanti Velugu Scheme');
      expect(summary.telugu_name).toBe('డాక్టర్ వైఎస్సార్ కంటి వెలుగు పథకం');
      expect(summary.simplified.benefits).toContain('cataract surgeries');
    });
  });

  describe('extractTextFromPdf & processSchemeDocumentPdf', () => {
    test('should throw an error for non-existent file path', async () => {
      await expect(extractTextFromPdf('/tmp/non_existent_file_12345.pdf')).rejects.toThrow('not found');
    });

    test('should handle empty buffer gracefully', async () => {
      const res = await extractTextFromPdf(Buffer.alloc(0));
      expect(res.text).toBe('');
      expect(res.charCount).toBe(0);
      expect(res.isTextExtracted).toBe(false);
    });

    test('should process a valid PDF buffer end-to-end', async () => {
      // Minimal valid PDF binary representation
      const validPdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF'
      );

      const result = await processSchemeDocumentPdf(validPdfBuffer, {
        filename: 'ap_flagship_scheme.pdf'
      });

      expect(result).toBeDefined();
      expect(result.scheme_name).toBeDefined();
      expect(result.metadata.filename).toBe('ap_flagship_scheme.pdf');
      expect(result.simplified).toBeDefined();
      expect(result.telugu).toBeDefined();
    });
  });

});
