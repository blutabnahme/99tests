'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface HCConfirmationBannerProps {
  recommendationId: string;
  collectorName: string;
  collectionDate: string;
  deadlineDate: string;
}

export default function HCConfirmationBanner({ 
  recommendationId, 
  collectorName, 
  collectionDate, 
  deadlineDate 
}: HCConfirmationBannerProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const t = useTranslations('hc.confirmation');
  
  const [disputeForm, setDisputeForm] = useState({
    issue_type: 'Incomplete collection',
    description: ''
  });

  // Countdown effect
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadline = new Date(deadlineDate).getTime();
      const difference = deadline - now;
      
      if (difference <= 0) {
        setTimeLeft(t('autoConfirming'));
        return;
      }
      
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      // If it's more than 24h, add days
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        setTimeLeft(t('autoConfirmsInDays', { days, hours, minutes }));
      } else {
        setTimeLeft(t('autoConfirmsInHours', { hours, minutes }));
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // update every minute
    return () => clearInterval(timer);
  }, [deadlineDate, t]);

  const handleConfirm = async () => {
    if (!window.confirm(t('confirmPrompt'))) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/recommendations/${recommendationId}/confirm`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to confirm collection');
      
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeForm.description.trim()) {
      alert('Please provide a description');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/recommendations/${recommendationId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disputeForm)
      });
      if (!res.ok) throw new Error('Failed to submit dispute');
      
      setShowDisputeModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-heading text-[18px] font-medium text-amber-900 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          {t('title')}
        </h3>
        
        <p className="text-[14px] text-amber-800/80 mb-4 max-w-3xl leading-relaxed">
          <strong className="font-bold text-amber-900">{collectorName}</strong> {t('desc', { name: '', date: new Date(collectionDate).toLocaleDateString() }).replace(new Date(collectionDate).toLocaleDateString(), '')} <strong className="font-bold text-amber-900">{new Date(collectionDate).toLocaleDateString()}</strong>.
        </p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-5">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              onClick={handleConfirm}
              disabled={loading}
              className="bg-primary hover:bg-primary-dark text-white py-2 px-5 rounded-full font-semibold text-[14px] shadow-sm flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {t('confirmBtn')}
            </Button>
            
            <Button 
              onClick={() => setShowDisputeModal(true)}
              disabled={loading}
              className="border border-red-600 text-red-600 bg-transparent hover:bg-red-50 py-2 px-5 rounded-full font-semibold text-[14px] flex-1 sm:flex-none"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              {t('reportIssue')}
            </Button>
          </div>
          
          <div className="text-[13px] text-amber-600 font-mono font-medium flex items-center gap-1.5 bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
            <Clock className="w-4 h-4" />
            {timeLeft}
          </div>
        </div>
      </div>

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[20px] shadow-xl p-6 w-full max-w-[480px]">
            <h2 className="font-heading text-[20px] font-medium text-near-black mb-4">{t('reportModalTitle')}</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">{t('issueType')}</label>
                <select 
                  value={disputeForm.issue_type}
                  onChange={e => setDisputeForm({...disputeForm, issue_type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="Incomplete collection">{t('types.incomplete')}</option>
                  <option value="Wrong materials used">{t('types.wrongMat')}</option>
                  <option value="Patient complaint">{t('types.complaint')}</option>
                  <option value="No-show">{t('types.noShow')}</option>
                  <option value="Other">{t('types.other')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">{t('descLabel')}</label>
                <textarea 
                  value={disputeForm.description}
                  onChange={e => setDisputeForm({...disputeForm, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-none"
                  placeholder={t('descPlaceholder')}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowDisputeModal(false)}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDisputeSubmit}
                disabled={loading || !disputeForm.description.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? t('submitting') : t('submitReport')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
