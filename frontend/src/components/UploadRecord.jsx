import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { 
  FolderUp, 
  FileText, 
  Cpu, 
  ClipboardSignature, 
  CheckSquare, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Hash,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

export default function UploadRecord() {
  const { token } = useAuth();
  
  // Wizard steps: 1 = File Upload, 2 = OCR Simulation, 3 = Metadata Form, 4 = QA Verification, 5 = Success
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  
  // Metadata fields
  const [firNumber, setFirNumber] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [district, setDistrict] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [recordType, setRecordType] = useState('FIR');
  const [keywords, setKeywords] = useState('');

  // OCR state simulation
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('Initializing scanning hardware...');

  // Quality check checkboxes
  const [qaChecks, setQaChecks] = useState({
    matchesCase: false,
    dpiChecked: false,
    ocrLegible: false
  });

  // Submission/Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedDocInfo, setUploadedDocInfo] = useState(null);

  const fileInputRef = useRef(null);

  // Run simulated OCR when stepping into step 2
  useEffect(() => {
    if (step === 2) {
      setOcrProgress(0);
      setOcrStatusText('Initializing high-speed scanner node...');
      
      const statuses = [
        { progress: 15, text: 'Opening file stream buffer...' },
        { progress: 40, text: 'Running OCR character segmentation...' },
        { progress: 65, text: 'Extracting metadata text streams...' },
        { progress: 90, text: 'Verifying digital integrity checksums...' },
        { progress: 100, text: 'OCR processing complete. Directing to registry...' }
      ];

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < statuses.length) {
          setOcrProgress(statuses[currentIndex].progress);
          setOcrStatusText(statuses[currentIndex].text);
          currentIndex++;
        } else {
          clearInterval(interval);
          // Auto-advance to metadata entry step
          setTimeout(() => {
            setStep(3);
          }, 800);
        }
      }, 400);

      return () => clearInterval(interval);
    }
  }, [step]);

  // Handle drag and drop file selections
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    // Validate file type (PDF/Images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid File Format: Only secure PDFs and standard JPEGs/PNGs are permitted.');
      return;
    }
    // Limit to 50MB
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File Limit Exceeded: Scans must be smaller than 50MB.');
      return;
    }
    setFile(selectedFile);
  };

  // Trigger file dialog
  const triggerFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle quality control checkbox toggling
  const handleQaToggle = (checkKey) => {
    setQaChecks(prev => ({
      ...prev,
      [checkKey]: !prev[checkKey]
    }));
  };

  // Submit digitization payload
  const handleDigitizeAndSign = async () => {
    if (!qaChecks.matchesCase || !qaChecks.dpiChecked || !qaChecks.ocrLegible) {
      setError('Quality Control Action Required: Verify and check all validation requirements.');
      return;
    }

    setLoading(true);
    setError('');

    // Create form data multipart payload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('firNumber', firNumber);
    formData.append('caseNumber', caseNumber);
    formData.append('policeStation', policeStation);
    formData.append('district', district);
    formData.append('year', year);
    formData.append('recordType', recordType);
    
    // Parse keywords into array
    const keywordsArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k !== '');
    
    formData.append('keywords', JSON.stringify(keywordsArray));

    try {
      const response = await axios.post(`${API_BASE}/api/documents/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedDocInfo(response.data.document);
      setStep(5); // Go to success view
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Digitization submission failed. Please verify server state.');
    } finally {
      setLoading(false);
    }
  };

  // Clear wizard state for next upload
  const resetUploadWizard = () => {
    setFile(null);
    setFirNumber('');
    setCaseNumber('');
    setPoliceStation('');
    setDistrict('');
    setYear(new Date().getFullYear());
    setRecordType('FIR');
    setKeywords('');
    setQaChecks({
      matchesCase: false,
      dpiChecked: false,
      ocrLegible: false
    });
    setUploadedDocInfo(null);
    setError('');
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
      
      {/* Page Title & Breadcrumbs */}
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight font-serif">Record Digitization Pipeline</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload and extract metadata from administrative and judicial documentation.</p>
      </div>

      {/* Progress Wizard Header Banner */}
      {step < 5 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors">
          <div className="flex items-center gap-6 w-full justify-around text-center text-sm font-medium">
            <span className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${step >= 1 ? 'border-police-600 text-police-600 dark:border-gold-500 dark:text-gold-400 font-bold' : 'border-transparent text-slate-400 dark:text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center font-mono text-[10px]">1</span>
              File Import
            </span>
            <span className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${step >= 2 ? 'border-police-600 text-police-600 dark:border-gold-500 dark:text-gold-400 font-bold' : 'border-transparent text-slate-400 dark:text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center font-mono text-[10px]">2</span>
              OCR Extraction
            </span>
            <span className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${step >= 3 ? 'border-police-600 text-police-600 dark:border-gold-500 dark:text-gold-400 font-bold' : 'border-transparent text-slate-400 dark:text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center font-mono text-[10px]">3</span>
              Index Metadata
            </span>
            <span className={`pb-1 border-b-2 flex items-center gap-1.5 transition-colors ${step >= 4 ? 'border-police-600 text-police-600 dark:border-gold-500 dark:text-gold-400 font-bold' : 'border-transparent text-slate-400 dark:text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center font-mono text-[10px]">4</span>
              QA Verification
            </span>
          </div>
        </div>
      )}

      {/* Error Alert Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">System Alert:</strong>
            {error}
          </div>
        </div>
      )}

      {/* ================= STEP 1: FILE IMPORT DRAG & DROP ================= */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm transition-colors">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-police-500/30 dark:hover:border-gold-500/30 transition-all rounded-2xl p-10 text-center bg-slate-50/50 dark:bg-slate-950/60 flex flex-col items-center justify-center space-y-4 cursor-pointer"
               onDragOver={handleDragOver}
               onDrop={handleDrop}
               onClick={triggerFileDialog}>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg"
            />

            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-police-600 dark:group-hover:text-gold-500 shadow-sm transition-colors">
              <FolderUp className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-850 dark:text-slate-200">Import Scanned Legal File</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag and drop file here, or click to browse local folders</p>
            </div>

            <div className="text-xs text-slate-650 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-850">
              Accepted configurations: Secure PDF, PNG, JPG, or JPEG up to 50MB
            </div>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-police-600 dark:text-gold-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-slate-850 dark:text-slate-200 truncate max-w-sm sm:max-w-md">{file.name}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {file.type.split('/')[1].toUpperCase()}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Process Document</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: SIMULATED OCR AND TEXT EXTRACTION ================= */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 text-center shadow-sm transition-colors">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-police-500/10 dark:border-gold-500/10 flex items-center justify-center text-police-600 dark:text-gold-500">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            {/* Spinning border */}
            <div className="absolute inset-0 border-2 border-t-police-600 dark:border-t-gold-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-850 dark:text-white">OCR Parsing & Text Structuring</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 max-w-xs mx-auto leading-normal">{ocrStatusText}</p>
          </div>

          <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-police-600 to-police-500 dark:from-gold-600 dark:to-gold-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${ocrProgress}%` }}
            ></div>
          </div>

          <span className="text-xs font-mono text-police-700 dark:text-gold-500 font-bold bg-police-50 dark:bg-gold-500/5 px-2.5 py-0.5 rounded-md border border-police-100 dark:border-gold-500/20 uppercase tracking-widest">
            {ocrProgress}% Complete
          </span>
        </div>
      )}

      {/* ================= STEP 3: METADATA FORMS ENTRY ================= */}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Index Case Metadata</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Specify tracking parameters according to original file markings.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* FIR Number */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">FIR Number</label>
              <input 
                type="text" 
                required
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all font-mono" 
                placeholder="e.g., FIR/0023/2026" 
              />
            </div>

            {/* Case Number */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Case Number</label>
              <input 
                type="text" 
                required
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all font-mono" 
                placeholder="e.g., CR-891/2026" 
              />
            </div>

            {/* Police Station */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Police Station (Thana)</label>
              <input 
                type="text" 
                required
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all" 
                placeholder="e.g., Patna Town PS" 
              />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">District</label>
              <input 
                type="text" 
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all" 
                placeholder="e.g., Patna" 
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Filing Year</label>
              <input 
                type="number" 
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all font-mono" 
                placeholder="e.g., 2026" 
              />
            </div>

            {/* Record Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2">Record Classification Type</label>
              <select 
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-350 focus:outline-none transition-all"
              >
                <option value="FIR">First Information Report (FIR)</option>
                <option value="Case Diary">Case Diary (CD)</option>
                <option value="Administrative Order">Administrative Order</option>
                <option value="Charge Sheet">Charge Sheet</option>
                <option value="General Diary">General Diary (GD)</option>
                <option value="Other">Other Miscellaneous Record</option>
              </select>
            </div>

          </div>

          {/* Keywords Tagging */}
          <div>
            <label className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Search Keywords</span>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-mono">Separated by commas</span>
            </label>
            <input 
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-police-500 dark:focus:border-gold-500 focus:ring-1 focus:ring-police-500 dark:focus:ring-gold-500 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none transition-all" 
              placeholder="e.g., homicide, IPC 302, local theft, weapon recovered" 
            />
          </div>

          {/* Nav Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-155 dark:border-slate-850">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </button>
            
            <button 
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-sm rounded-xl shadow-md dark:hover:shadow-gold-500/25 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 4: QA VERIFICATION ================= */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Quality Check & Digital Signature Authorization</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review the indexed metadata and authorize digital signing checks.</p>
          </div>

          {/* Grid Preview */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 transition-colors">
            
            <div className="sm:col-span-2 border-b border-slate-200 dark:border-slate-900 pb-3 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-police-600 dark:text-gold-500" />
              <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Document Summary</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">Record Type:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{recordType}</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">Uploaded File:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono truncate block max-w-[280px]">{file?.name}</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">FIR Number:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{firNumber}</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">Case Reference:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{caseNumber}</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">Police Station:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{policeStation}</span>
            </div>

            <div className="text-sm">
              <span className="text-slate-400 dark:text-slate-500 block">Jurisdiction District / Year:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{district} &bull; {year}</span>
            </div>

            {keywords && (
              <div className="sm:col-span-2 text-sm">
                <span className="text-slate-400 dark:text-slate-500 block mb-1">Keywords:</span>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.split(',').map((kw, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                      {kw.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Quality check requirements */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 transition-colors">
            <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-police-600 dark:text-gold-500" />
              Required Quality Assertions
            </h4>
            
            <div className="space-y-3 pt-2">
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 cursor-pointer text-sm group">
                <input 
                  type="checkbox" 
                  checked={qaChecks.matchesCase}
                  onChange={() => handleQaToggle('matchesCase')}
                  className="mt-1.5 rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-police-600 dark:text-gold-500 focus:ring-police-500 dark:focus:ring-gold-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-950" 
                />
                <span className="text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200 leading-normal">
                  Scanned text matches the original paper document and case numbers align perfectly.
                </span>
              </label>

              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 cursor-pointer text-sm group">
                <input 
                  type="checkbox" 
                  checked={qaChecks.dpiChecked}
                  onChange={() => handleQaToggle('dpiChecked')}
                  className="mt-1.5 rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-police-600 dark:text-gold-500 focus:ring-police-500 dark:focus:ring-gold-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-950" 
                />
                <span className="text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200 leading-normal">
                  Scan resolution meets the 300 DPI minimum clarity standard without pixelation.
                </span>
              </label>

              {/* Checkbox 3 */}
              <label className="flex items-start gap-3 cursor-pointer text-sm group">
                <input 
                  type="checkbox" 
                  checked={qaChecks.ocrLegible}
                  onChange={() => handleQaToggle('ocrLegible')}
                  className="mt-1.5 rounded border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-950 text-police-600 dark:text-gold-500 focus:ring-police-500 dark:focus:ring-gold-500 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-950" 
                />
                <span className="text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200 leading-normal">
                  OCR characters are fully indexed, legible, and verified free of scanning noise.
                </span>
              </label>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-150 dark:border-slate-850">
            <button 
              type="button" 
              onClick={() => setStep(3)}
              disabled={loading}
              className="px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modify Details</span>
            </button>
            
            <button 
              type="button"
              disabled={loading || !qaChecks.matchesCase || !qaChecks.dpiChecked || !qaChecks.ocrLegible}
              onClick={handleDigitizeAndSign}
              className="px-6 py-3 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Archiving & Encrypting...</span>
                </>
              ) : (
                <>
                  <ClipboardSignature className="w-4 h-4" />
                  <span>Approve Quality & Digitally Sign</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: SUCCESS INTERFACE ================= */}
      {step === 5 && uploadedDocInfo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 text-center max-w-2xl mx-auto relative overflow-hidden shadow-sm transition-colors">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>

          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">Verification Successful</h3>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-950 dark:text-slate-100">Record Digitized & Securely Archived</h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Document reference <strong className="text-slate-800 dark:text-slate-200 font-mono">[{uploadedDocInfo.caseNumber}]</strong> has been encrypted and logged in the state registry archive.
            </p>
          </div>

          {/* Secure details box */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 text-left font-mono text-xs space-y-3 transition-colors">
            
            <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 dark:border-slate-900 pb-2">
              <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="w-4 h-4 text-emerald-500" /> SECURE BLOCK DETAILS</span>
              <span>NODE: BR-01</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-slate-700 dark:text-slate-300 gap-1">
              <span className="text-slate-450 dark:text-slate-500">SYSTEM ID:</span>
              <span className="text-slate-600 dark:text-slate-400 select-all">{uploadedDocInfo.id}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-slate-750 dark:text-slate-300 gap-1">
              <span className="text-slate-455 dark:text-slate-500">ENCRYPTION STATE:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span>AES-256 ENFORCED</span>
              </span>
            </div>

            <div className="flex flex-col text-slate-700 dark:text-slate-350 gap-1 border-t border-slate-200 dark:border-slate-900 pt-2.5">
              <span className="text-slate-450 dark:text-slate-500 flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-gold-600 dark:text-gold-500" /> SHA-256 DIGITAL SIGNATURE:</span>
              <span className="text-gold-600 dark:text-gold-500 break-all select-all font-semibold font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 mt-2 block">
                {uploadedDocInfo.digitalSignature}
              </span>
            </div>

          </div>

          {/* Complete action */}
          <button 
            type="button" 
            onClick={resetUploadWizard}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-police-700 to-police-600 dark:from-gold-600 dark:to-gold-500 hover:from-police-600 hover:to-police-500 dark:hover:from-gold-500 dark:hover:to-gold-400 text-white dark:text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            Digitize Next Record
          </button>
        </div>
      )}

    </div>
  );
}
