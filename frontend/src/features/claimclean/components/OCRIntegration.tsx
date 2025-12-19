import React, { useState } from 'react';
import { Card, Steps, Button, message } from 'antd';
import {
  CloudUploadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import DocumentUploadWithOCR from './DocumentUploadWithOCR';
import OCRResultsReview from './OCRResultsReview';
import type { OCRResult } from '../types';

interface OCRIntegrationProps {
  claimId: string;
  onComplete?: (ocrResults: OCRResult[]) => void;
  onDocumentsUploaded?: (files: File[], results: OCRResult[]) => void;
}

const OCRIntegration: React.FC<OCRIntegrationProps> = ({
  claimId,
  onComplete,
  onDocumentsUploaded,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleOCRComplete = (result: OCRResult) => {
    setOcrResults(prev => {
      const existing = prev.find(r => r.documentId === result.documentId);
      if (existing) {
        return prev.map(r => r.documentId === result.documentId ? result : r);
      }
      return [...prev, result];
    });

    // Auto-advance to review step when first document is processed
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  const handleFileUpload = (file: File, _url: string) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleValidationComplete = (validatedResults: OCRResult[]) => {
    setOcrResults(validatedResults);
  };

  const handleFieldCorrection = (documentId: string, fieldName: string, correctedValue: string) => {
    setOcrResults(prev =>
      prev.map(result =>
        result.documentId === documentId
          ? {
              ...result,
              extractedFields: result.extractedFields.map(field =>
                field.fieldName === fieldName
                  ? { ...field, extractedValue: correctedValue, validated: true }
                  : field
              ),
            }
          : result
      )
    );
  };

  const handleCompleteIntegration = () => {
    if (ocrResults.length === 0) {
      message.error('No OCR results to complete');
      return;
    }

    // Check if all fields are validated
    const allFieldsValidated = ocrResults.every(result =>
      result.extractedFields.every(field => field.validated === true)
    );

    if (!allFieldsValidated) {
      message.warning('Please validate all extracted fields before completing');
      return;
    }

    onComplete?.(ocrResults);
    onDocumentsUploaded?.(uploadedFiles, ocrResults);
    setCurrentStep(2);
    message.success('OCR integration completed successfully!');
  };

  const canProceedToReview = ocrResults.length > 0;
  const canComplete = ocrResults.length > 0 && 
    ocrResults.every(result => 
      result.extractedFields.some(field => field.validated === true)
    );

  const steps = [
    {
      title: 'Upload Documents',
      icon: <CloudUploadOutlined />,
      description: 'Upload and process documents',
    },
    {
      title: 'Review & Validate',
      icon: <EyeOutlined />,
      description: 'Review extracted data',
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'Integration complete',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Steps
          current={currentStep}
          items={steps}
          className="mb-6"
        />
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>
          
          <div className="space-x-2">
            {currentStep === 1 && (
              <Button
                onClick={() => setCurrentStep(0)}
              >
                Back to Upload
              </Button>
            )}
            
            {currentStep === 0 && (
              <Button
                type="primary"
                onClick={() => setCurrentStep(1)}
                disabled={!canProceedToReview}
              >
                Review Results ({ocrResults.length})
              </Button>
            )}
            
            {currentStep === 1 && (
              <Button
                type="primary"
                onClick={handleCompleteIntegration}
                disabled={!canComplete}
              >
                Complete Integration
              </Button>
            )}
          </div>
        </div>
      </Card>

      {currentStep === 0 && (
        <DocumentUploadWithOCR
          claimId={claimId}
          onOCRComplete={handleOCRComplete}
          onFileUpload={handleFileUpload}
          showTemplateSelection
        />
      )}

      {currentStep === 1 && ocrResults.length > 0 && (
        <OCRResultsReview
          ocrResults={ocrResults}
          onValidationComplete={handleValidationComplete}
          onFieldCorrection={handleFieldCorrection}
          editable
          showPreview
        />
      )}

      {currentStep === 2 && (
        <Card className="text-center py-8">
          <CheckCircleOutlined className="text-5xl text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            OCR Integration Complete!
          </h3>
          <p className="text-gray-600 mb-4">
            Successfully processed {ocrResults.length} documents and extracted{' '}
            {ocrResults.reduce((total, result) => total + result.extractedFields.length, 0)}{' '}
            data fields.
          </p>
          <div className="text-sm text-gray-500">
            All extracted data has been validated and is ready for claim submission.
          </div>
        </Card>
      )}

      {ocrResults.length > 0 && currentStep < 2 && (
        <Card size="small">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Progress: {ocrResults.length} documents processed, {' '}
              {ocrResults.reduce((total, result) => 
                total + result.extractedFields.filter(f => f.validated).length, 0
              )} / {' '}
              {ocrResults.reduce((total, result) => total + result.extractedFields.length, 0)}{' '}
              fields validated
            </div>
            <div className="text-sm text-gray-500">
              Claim ID: {claimId}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OCRIntegration;