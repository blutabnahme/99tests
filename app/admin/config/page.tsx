"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format-date';

import React, { useState, useEffect } from 'react';
import { Loader2, Save, Settings, Truck, Database, AlertCircle, CheckCircle2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'pricing' | 'shipping' | 'billing' | 'system'>('pricing');

  // Form state
  const [serviceFee, setServiceFee] = useState('');
  const [doctorBillingFee, setDoctorBillingFee] = useState('');
  const [vatRate, setVatRate] = useState('');
  const [shippingStandard, setShippingStandard] = useState('');
  const [shippingPrio, setShippingPrio] = useState('');
  const [shippingExpress, setShippingExpress] = useState('');
  const [shippingGologistik, setShippingGologistik] = useState('');
  const [pvsPrefix, setPvsPrefix] = useState('');
  const [countryZoneMapping, setCountryZoneMapping] = useState('');

  // Billing state
  const [companyName, setCompanyName] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyZip, setCompanyZip] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCeo, setCompanyCeo] = useState('');
  const [companyRegistry, setCompanyRegistry] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyUstId, setCompanyUstId] = useState('');
  const [companyBankName, setCompanyBankName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankBic, setBankBic] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [invoicePaymentTerms, setInvoicePaymentTerms] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [invoiceFooterText, setInvoiceFooterText] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Failed to load configuration');
      const data = await res.json();
      setConfig(data);
      setServiceFee(String(data.service_fee_pct ?? ''));
      setDoctorBillingFee(String(data.doctor_billing_service_fee_pct ?? ''));
      setVatRate(String(data.vat_rate ?? ''));
      setShippingStandard(String(data.shipping_standard ?? ''));
      setShippingPrio(String(data.shipping_prio ?? ''));
      setShippingExpress(String(data.shipping_express ?? ''));
      setShippingGologistik(String(data.shipping_gologistik ?? ''));
      setPvsPrefix(data.pvs_file_prefix || '');
      setCountryZoneMapping(data.country_zone_mapping ? JSON.stringify(data.country_zone_mapping, null, 2) : '{}');

      setCompanyName(data.company_name || '');
      setCompanyStreet(data.company_street || '');
      const zipCity = data.company_zip_city || '';
      const zipMatch = zipCity.match(/^(\d{4,5})\s*(.*)/);
      if (zipMatch) {
        setCompanyZip(zipMatch[1]);
        setCompanyCity(zipMatch[2]);
      } else {
        setCompanyZip('');
        setCompanyCity(zipCity);
      }
      setCompanyCountry(data.company_country || '');
      setCompanyEmail(data.company_email || '');
      setCompanyPhone(data.company_phone || '');
      setCompanyWebsite(data.company_website || '');
      setCompanyCeo(data.company_ceo || '');
      setCompanyRegistry(data.company_registry || '');
      setCompanyTaxId(data.company_tax_id || '');
      setCompanyUstId(data.company_ust_id || '');
      setCompanyBankName(data.company_bank_name || '');
      setBankIban(data.bank_iban || '');
      setBankBic(data.bank_bic || '');
      setInvoicePrefix(data.invoice_prefix || '');
      setInvoicePaymentTerms(String(data.invoice_payment_terms_days || ''));
      setBillingPeriod(data.billing_period || 'monthly');
      setInvoiceFooterText(data.invoice_footer_text || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Validate country zone mapping JSON
      let parsedZoneMapping;
      try {
        parsedZoneMapping = JSON.parse(countryZoneMapping);
      } catch (e) {
        throw new Error('Country zone mapping is not valid JSON');
      }

      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_fee_pct: parseFloat(serviceFee) || 0,
          doctor_billing_service_fee_pct: parseFloat(doctorBillingFee) || 0,
          vat_rate: parseFloat(vatRate) || 0,
          shipping_standard: parseFloat(shippingStandard) || 0,
          shipping_prio: parseFloat(shippingPrio) || 0,
          shipping_express: parseFloat(shippingExpress) || 0,
          shipping_gologistik: parseFloat(shippingGologistik) || 0,
          pvs_file_prefix: pvsPrefix,
          country_zone_mapping: parsedZoneMapping,
          company_name: companyName,
          company_street: companyStreet,
          company_zip_city: `${companyZip} ${companyCity}`.trim(),
          company_country: companyCountry,
          company_email: companyEmail,
          company_phone: companyPhone,
          company_website: companyWebsite,
          company_ceo: companyCeo,
          company_registry: companyRegistry,
          company_tax_id: companyTaxId,
          company_ust_id: companyUstId,
          company_bank_name: companyBankName,
          bank_iban: bankIban,
          bank_bic: bankBic,
          invoice_prefix: invoicePrefix,
          invoice_payment_terms_days: parseInt(invoicePaymentTerms) || 14,
          billing_period: billingPeriod,
          invoice_footer_text: invoiceFooterText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const updated = await res.json();
      setConfig(updated);
      setSuccess('Configuration saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = "w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors";
  const labelClasses = "text-[13px] font-medium text-gray-700";

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const tabs = [
    { id: 'pricing' as const, label: 'Pricing', icon: Settings },
    { id: 'billing' as const, label: 'Billing', icon: Receipt },
    { id: 'shipping' as const, label: 'Shipping', icon: Truck },
    { id: 'system' as const, label: 'System', icon: Database },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">Configuration</h1>
          <p className="text-gray-500 text-[14px] mt-1">Platform pricing, shipping, and system settings.</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="rounded-full shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          Save Changes
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-[16px] text-sm font-medium border border-green-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Pricing & Fees</h2>
              <p className="text-[13px] text-gray-500">Configure the platform service fee and tax rates applied to all orders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={labelClasses}>Service Fee (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={serviceFee}
                    onChange={e => setServiceFee(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 15.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>VAT Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={vatRate}
                    onChange={e => setVatRate(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 19.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                </div>
              </div>
            </div>
            <p className="text-[12px] text-gray-400">German VAT rate applied to service fees and shipping.</p>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-3">Doctor Billing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Doctor Billing Service Fee (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={doctorBillingFee}
                      onChange={e => setDoctorBillingFee(e.target.value)}
                      className={`${inputClasses} pr-10`}
                      placeholder="e.g. 10.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                  </div>
                  <p className="text-[12px] text-gray-400">Service fee applied when a doctor pays on behalf of the patient (monthly invoice).</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-[12px] p-4 border border-gray-100">
              <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Preview (€100 test costs)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-[13px] text-gray-600 space-y-1">
                  <div className="text-[11px] font-bold text-gray-400 uppercase mb-1">Patient Pays</div>
                  <div>Service fee ({serviceFee || '0'}%): €{((100 * (parseFloat(serviceFee) || 0)) / 100).toFixed(2)}</div>
                  <div>VAT ({vatRate || '0'}%): €{(((parseFloat(serviceFee) || 0) + 5) * (parseFloat(vatRate) || 0) / 100).toFixed(2)}</div>
                  <div className="font-semibold text-near-black pt-1 border-t border-gray-200">
                    Total: €{(100 + (100 * (parseFloat(serviceFee) || 0)) / 100 + 5 + ((parseFloat(serviceFee) || 0) + 5) * (parseFloat(vatRate) || 0) / 100).toFixed(2)}
                  </div>
                </div>
                <div className="text-[13px] text-gray-600 space-y-1">
                  <div className="text-[11px] font-bold text-primary uppercase mb-1">Doctor Pays</div>
                  <div>Service fee ({doctorBillingFee || '0'}%): €{((100 * (parseFloat(doctorBillingFee) || 0)) / 100).toFixed(2)}</div>
                  <div>VAT ({vatRate || '0'}%): €{(((parseFloat(doctorBillingFee) || 0) + 5) * (parseFloat(vatRate) || 0) / 100).toFixed(2)}</div>
                  <div className="font-semibold text-primary pt-1 border-t border-gray-200">
                    Total: €{(100 + (100 * (parseFloat(doctorBillingFee) || 0)) / 100 + 5 + ((parseFloat(doctorBillingFee) || 0) + 5) * (parseFloat(vatRate) || 0) / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {/* Company Information */}
            <div>
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Company Information</h2>
              <p className="text-[13px] text-gray-500 mb-4">Used on invoices and official documents.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Row 1 */}
                <div className="space-y-1.5">
                  <label className={labelClasses}>Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClasses} placeholder="Wir sind Immun GmbH" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Managing Director</label>
                  <input type="text" value={companyCeo} onChange={e => setCompanyCeo(e.target.value)} className={inputClasses} placeholder="Max Mustermann" />
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <label className={labelClasses}>Street Address</label>
                  <input type="text" value={companyStreet} onChange={e => setCompanyStreet(e.target.value)} className={inputClasses} placeholder="Münchener Str. 38" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Country</label>
                  <input type="text" value={companyCountry} onChange={e => setCompanyCountry(e.target.value)} className={inputClasses} placeholder="Deutschland" />
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <label className={labelClasses}>ZIP Code</label>
                  <input type="text" value={companyZip} onChange={e => setCompanyZip(e.target.value)} className={inputClasses} placeholder="60311" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>City</label>
                  <input type="text" value={companyCity} onChange={e => setCompanyCity(e.target.value)} className={inputClasses} placeholder="Frankfurt am Main" />
                </div>

                {/* Row 4 */}
                <div className="space-y-1.5">
                  <label className={labelClasses}>Email</label>
                  <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className={inputClasses} placeholder="info@99tests.de" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Phone</label>
                  <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className={inputClasses} placeholder="+49 69 12345678" />
                </div>

                {/* Row 5 */}
                <div className="space-y-1.5">
                  <label className={labelClasses}>Website</label>
                  <input type="text" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} className={inputClasses} placeholder="https://99tests.de" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Registry Info</label>
                  <input type="text" value={companyRegistry} onChange={e => setCompanyRegistry(e.target.value)} className={inputClasses} placeholder="Amtsgericht Frankfurt HRB XXXXX" />
                </div>
              </div>
            </div>

            {/* Tax & Legal */}
            <div className="pt-6 border-t border-gray-100">
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Tax & Legal</h2>
              <p className="text-[13px] text-gray-500 mb-4">Required for German invoice compliance (§14 UStG).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Steuernummer</label>
                  <input type="text" value={companyTaxId} onChange={e => setCompanyTaxId(e.target.value)} className={inputClasses} placeholder="045/123/45678" />
                  <p className="text-[12px] text-gray-400">German tax number issued by the local tax office.</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>USt-IdNr</label>
                  <input type="text" value={companyUstId} onChange={e => setCompanyUstId(e.target.value)} className={inputClasses} placeholder="DE123456789" />
                  <p className="text-[12px] text-gray-400">EU VAT identification number.</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="pt-6 border-t border-gray-100">
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Bank Details</h2>
              <p className="text-[13px] text-gray-500 mb-4">Payment information shown on invoices.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Bank Name</label>
                  <input type="text" value={companyBankName} onChange={e => setCompanyBankName(e.target.value)} className={inputClasses} placeholder="Deutsche Bank" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>IBAN</label>
                  <input type="text" value={bankIban} onChange={e => setBankIban(e.target.value)} className={inputClasses} placeholder="DE89 3704 0044 0532 0130 00" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>BIC / SWIFT</label>
                  <input type="text" value={bankBic} onChange={e => setBankBic(e.target.value)} className={inputClasses} placeholder="COBADEFFXXX" />
                </div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div className="pt-6 border-t border-gray-100">
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Invoice Settings</h2>
              <p className="text-[13px] text-gray-500 mb-4">Configure invoice numbering and payment terms.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Invoice Prefix</label>
                  <input type="text" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className={inputClasses} placeholder="INV" />
                  <p className="text-[12px] text-gray-400">E.g., INV → INV-2026-0001</p>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Payment Terms (Days)</label>
                  <input type="number" value={invoicePaymentTerms} onChange={e => setInvoicePaymentTerms(e.target.value)} className={inputClasses} placeholder="14" />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClasses}>Billing Period</label>
                  <select value={billingPeriod} onChange={e => setBillingPeriod(e.target.value)} className={inputClasses} style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23999' stroke-width='1.5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    appearance: 'none',
                  }}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <label className={labelClasses}>Invoice Footer Text</label>
                <textarea value={invoiceFooterText} onChange={e => setInvoiceFooterText(e.target.value)} className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[14px] resize-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none" rows={3} placeholder="Custom text shown at the bottom of every invoice..." />
              </div>
            </div>
          </div>
        )}

        {/* SHIPPING TAB */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>Shipping Costs</h2>
              <p className="text-[13px] text-gray-500">Set the cost for each shipping tier. These are charged to the patient at checkout.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className={labelClasses}>Standard Shipping (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={shippingStandard}
                    onChange={e => setShippingStandard(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 4.99"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">€</span>
                </div>
                <p className="text-[12px] text-gray-400">DHL standard delivery (3-5 business days).</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Priority Shipping (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={shippingPrio}
                    onChange={e => setShippingPrio(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 7.99"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">€</span>
                </div>
                <p className="text-[12px] text-gray-400">DHL priority delivery (1-2 business days).</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>Express Shipping (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={shippingExpress}
                    onChange={e => setShippingExpress(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 12.99"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">€</span>
                </div>
                <p className="text-[12px] text-gray-400">DHL express delivery (next business day).</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>GoLogistik Shipping (€)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={shippingGologistik}
                    onChange={e => setShippingGologistik(e.target.value)}
                    className={`${inputClasses} pr-10`}
                    placeholder="e.g. 9.99"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">€</span>
                </div>
                <p className="text-[12px] text-gray-400">GoLogistik temperature-controlled delivery.</p>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-1" style={{ textTransform: 'none' }}>System Settings</h2>
              <p className="text-[13px] text-gray-500">Advanced platform configuration for file generation and exports.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5 max-w-sm">
                <label className={labelClasses}>PVS File Prefix</label>
                <input
                  type="text"
                  value={pvsPrefix}
                  onChange={e => setPvsPrefix(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. PV345000"
                />
                <p className="text-[12px] text-gray-400">Prefix used for PAD XML export filenames.</p>
              </div>

              <div className="space-y-1.5">
                <label className={labelClasses}>PAD Export Counter</label>
                <div className="flex items-center gap-3">
                  <div className="h-11 px-4 flex items-center text-[14px] rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-mono md:w-1/2">
                    {config?.pad_export_counter ?? 0}
                  </div>
                  <span className="text-[12px] text-gray-400">Read-only — increments automatically on each export.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={labelClasses}>Country Zone Mapping (JSON)</label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const current = JSON.parse(countryZoneMapping);
                        const allCountries = [
                          "AD","AE","AF","AG","AI","AL","AM","AO","AR","AS","AT","AU","AZ",
                          "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BM","BN","BO","BR","BS","BT","BW","BY","BZ",
                          "CA","CD","CF","CG","CH","CI","CL","CM","CN","CO","CR","CU","CV","CY","CZ",
                          "DE","DJ","DK","DM","DO","DZ",
                          "EC","EE","EG","ER","ES","ET",
                          "FI","FJ","FK","FM","FO","FR",
                          "GA","GB","GD","GE","GH","GI","GL","GM","GN","GQ","GR","GT","GW","GY",
                          "HK","HN","HR","HT","HU",
                          "ID","IE","IL","IN","IQ","IR","IS","IT",
                          "JM","JO","JP",
                          "KE","KG","KH","KI","KM","KN","KP","KR","KW","KZ",
                          "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
                          "MA","MC","MD","ME","MG","MK","ML","MM","MN","MO","MR","MT","MU","MV","MW","MX","MY","MZ",
                          "NA","NE","NG","NI","NL","NO","NP","NR","NZ",
                          "OM",
                          "PA","PE","PG","PH","PK","PL","PR","PS","PT","PW","PY",
                          "QA",
                          "RO","RS","RU","RW",
                          "SA","SB","SC","SD","SE","SG","SI","SK","SL","SM","SN","SO","SR","SS","ST","SV","SY","SZ",
                          "TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
                          "UA","UG","US","UY","UZ",
                          "VA","VC","VE","VN","VU",
                          "WS",
                          "YE",
                          "ZA","ZM","ZW"
                        ];
                        const filled: Record<string, number> = {};
                        for (const cc of allCountries) {
                          filled[cc] = current[cc] ?? 3;
                        }
                        setCountryZoneMapping(JSON.stringify(filled, null, 2));
                      } catch (e) {
                        alert('Fix the JSON first before filling countries.');
                      }
                    }}
                    className="text-[12px] text-primary font-medium hover:underline"
                  >
                    Fill all countries (default zone 3)
                  </button>
                </div>
                <textarea
                  value={countryZoneMapping}
                  onChange={e => setCountryZoneMapping(e.target.value)}
                  className="w-full min-h-[300px] p-4 text-[13px] font-mono rounded-[12px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-y"
                  placeholder='{"DE": 1, "AT": 1, "CH": 1}'
                />
                <p className="text-[12px] text-gray-400">Maps country codes to shipping zones (1 = DACH, 2 = EU, 3 = International). Must be valid JSON.</p>
              </div>
            </div>

            {/* Last updated */}
            {config?.updated_at && (
              <div className="text-[12px] text-gray-400 pt-4 border-t border-gray-100">
                Last updated: {formatDate(config.updated_at)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
