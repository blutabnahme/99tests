"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Download, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ImportTestsModalProps {
 onClose: () => void;
 onSuccess: () => void;
}

export default function ImportTestsModal({ onClose, onSuccess }: ImportTestsModalProps) {
 const [step, setStep] = useState<'upload' | 'validation' | 'result'>('upload');
 const [file, setFile] = useState<File | null>(null);
 const [isUploading, setIsUploading] = useState(false);
 const [validationResult, setValidationResult] = useState<any>(null);
 const [error, setError] = useState('');
 
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
 setMounted(true);
 }, []);

 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 setFile(e.target.files[0]);
 }
 };

 const handleValidate = async () => {
 if (!file) return;
 setIsUploading(true);
 setError('');

 const formData = new FormData();
 formData.append('file', file);

 try {
 const res = await fetch('/api/admin/catalog/import', {
 method: 'POST',
 body: formData
 });
 const data = await res.json();
 
 if (!res.ok) throw new Error(data.error || 'Validation failed');
 
 setValidationResult(data);
 setStep('validation');
 } catch (err: any) {
 setError(err.message);
 } finally {
 setIsUploading(false);
 }
 };

 const handleConfirm = async () => {
 if (!file) return;
 setIsUploading(true);
 setError('');

 const formData = new FormData();
 formData.append('file', file);

 try {
 const res = await fetch('/api/admin/catalog/import?confirm=true', {
 method: 'POST',
 body: formData
 });
 const data = await res.json();
 
 if (!res.ok) throw new Error(data.error || 'Import failed');
 
 setStep('result');
 } catch (err: any) {
 setError(err.message);
 } finally {
 setIsUploading(false);
 }
 };

 if (!mounted) return null;

 return createPortal(
 <div 
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
 style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
 onClick={onClose}
 >
 <div 
 className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4"
 onClick={(e) => e.stopPropagation()}
 >
 
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
 <h2 className="font-heading font-medium text-[20px] text-near-black">
 Import Test Catalog
 </h2>
 <button onClick={onClose} className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-6 overflow-y-auto flex-1 font-body">
 {error && (
 <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 shrink-0" />
 <div>{error}</div>
 </div>
 )}

 {step === 'upload' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center text-[14px]">
 <span className="text-gray-600">Upload an Excel (.xlsx) file to create or update tests.</span>
 <a href="/api/admin/catalog/template" className="text-primary font-medium flex items-center gap-1 hover:underline">
 <Download className="w-4 h-4" /> Download Template
 </a>
 </div>

 <div 
 className={`border-2 border-dashed rounded-[16px] p-8 text-center transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:bg-gray-50'}`}
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => {
 e.preventDefault();
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 setFile(e.dataTransfer.files[0]);
 }
 }}
 >
 {!file ? (
 <>
 <Table2 className="w-10 h-10 text-gray-400 mx-auto mb-4" />
 <p className="text-[14px] text-near-black font-medium mb-1">Drag and drop your Excel file here</p>
 <p className="text-[13px] text-gray-500 mb-4">or click to browse from your computer</p>
 <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-full">
 Select File
 </Button>
 </>
 ) : (
 <>
 <FileText className="w-10 h-10 text-primary mx-auto mb-4" />
 <p className="text-[15px] text-near-black font-semibold mb-1">{file.name}</p>
 <p className="text-[13px] text-gray-500 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
 <button onClick={() => setFile(null)} className="text-[13px] text-red-500 hover:underline">
 Remove File
 </button>
 </>
 )}
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileChange} 
 accept=".xlsx, .xls"
 className="hidden" 
 />
 </div>
 </div>
 )}

 {step === 'validation' && validationResult && (
 <div className="space-y-6">
 <div className="p-4 rounded-[12px] bg-blue-50 border border-blue-100 flex items-start gap-4">
 <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
 <div>
 <h3 className="font-semibold text-blue-900 text-[15px] mb-1">Ready to Import {validationResult.valid} items</h3>
 <p className="text-[13px] text-blue-800">
 {validationResult.inserts} new tests will be created and {validationResult.updates} existing tests will be updated.
 </p>
 </div>
 </div>

 {validationResult.errors > 0 && (
 <div>
 <h4 className="font-semibold text-near-black text-[14px] mb-3 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-red-500" />
 {validationResult.errors} Rows with Errors (Will be skipped)
 </h4>
 <div className="bg-red-50/50 border border-red-100 rounded-[12px] overflow-hidden">
 <div className="max-h-[200px] overflow-y-auto p-0">
 <table className="w-full text-left text-[13px]">
 <thead className="bg-red-50 sticky top-0">
 <tr>
 <th className="px-4 py-2 font-medium text-red-800">Row</th>
 <th className="px-4 py-2 font-medium text-red-800">SKU</th>
 <th className="px-4 py-2 font-medium text-red-800">Errors</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-red-100">
 {validationResult.error_details.map((err: any, i: number) => (
 <tr key={i}>
 <td className="px-4 py-2 text-red-600">{err.row}</td>
 <td className="px-4 py-2 text-red-600 font-mono">{err.sku}</td>
 <td className="px-4 py-2 text-red-600">
 <ul className="list-disc list-inside">
 {err.errors.map((e: string, j: number) => <li key={j}>{e}</li>)}
 </ul>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {step === 'result' && (
 <div className="py-8 text-center space-y-4">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
 <CheckCircle2 className="w-8 h-8 text-green-600" />
 </div>
 <h3 className="font-medium text-[20px] text-near-black">Import Successful!</h3>
 <p className="text-gray-500 text-[14px]">
 Successfully imported {validationResult?.valid} tests.
 {validationResult?.errors > 0 && ` ${validationResult.errors} error rows were skipped.`}
 </p>
 <div className="pt-4">
 <Button variant="primary" onClick={onSuccess} className="rounded-full px-8">
 Done
 </Button>
 </div>
 </div>
 )}
 </div>

 {/* Footer */}
 {step !== 'result' && (
 <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between rounded-b-[16px]">
 <Button variant="ghost" onClick={step === 'validation' ? () => setStep('upload') : onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={isUploading}>
 {step === 'validation' ? 'Back' : 'Cancel'}
 </Button>
 
 {step === 'upload' && (
 <Button variant="primary" onClick={handleValidate} disabled={!file || isUploading} className="rounded-full px-6 h-10 text-[14px]">
 {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
 Validate File -&gt;
 </Button>
 )}

 {step === 'validation' && (
 <Button variant="primary" onClick={handleConfirm} disabled={isUploading || validationResult?.valid === 0} className="rounded-full px-6 h-10 text-[14px]">
 {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
 Confirm Import
 </Button>
 )}
 </div>
 )}

 </div>
 </div>,
 document.body
 );
}
