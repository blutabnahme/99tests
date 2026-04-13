const fs = require('fs');
const file = 'c:/99tests/app/dashboard/recommendations/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. imports
content = content.replace(
  /import \{ ChevronLeft, ArrowLeft, Loader2, Edit2, Trash2, Send, Mail, CheckCircle2, Check, Copy, MessageCircle, Link2, Pencil, Download, FileText \} from 'lucide-react';/,
  "import { ChevronLeft, ArrowLeft, Loader2, Edit2, Trash2, Send, Mail, CheckCircle2, Check, Copy, MessageCircle, Link2, Pencil, Download, FileText, Package, Truck, ArrowRight, ExternalLink, Share2, ChevronDown, FlaskConical, Building2 } from 'lucide-react';\nimport { createPortal } from 'react-dom';"
);

// 2. state
content = content.replace(
  /const \[resultsLoading, setResultsLoading\] = useState\(false\);/,
  "const [resultsLoading, setResultsLoading] = useState(false);\n const [activeTab, setActiveTab] = useState<'overview' | 'shipping' | 'results'>('overview');\n const [showShareMenu, setShowShareMenu] = useState(false);"
);

// 3. effect
content = content.replace(
  /const handleCopy = \(link: string\) => \{/,
  "useEffect(() => {\n  const handleClickOutside = () => setShowShareMenu(false);\n  if (showShareMenu) {\n    document.addEventListener('click', handleClickOutside);\n    return () => document.removeEventListener('click', handleClickOutside);\n  }\n }, [showShareMenu]);\n\n const handleCopy = (link: string) => {"
);

// 4. Return block
const timelineMatch = content.match(/\{\/\* Status Timeline \*\/\}[\s\S]*?(?=\{\/\* Patient Card \*\/})/);
let timelineStr = timelineMatch[0];

const resultsMatch = content.match(/\{\/\* Lab Results Section \*\/\}[\s\S]*?(?=<\/div>\s*<ConfirmModal)/);
let resultsStr = resultsMatch[0];

// Extract inner results map
const mapStart = resultsStr.indexOf('{orderResults.map');
const mapEnd = resultsStr.indexOf('</div>\n      ) : (');
const innerResultsMap = resultsStr.substring(mapStart, mapEnd).trim();

const returnIdx = content.indexOf('return (');
const confirmModalIdx = content.indexOf('<ConfirmModal');

const newReturnStr = `return (
<div className="max-w-5xl mx-auto space-y-6 pb-20 font-body">
  {toastMessage && (
    <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
  )}

  {/* Back link */}
  <button onClick={() => router.back()} className="text-[13px] text-gray-400 hover:text-primary flex items-center gap-1 mb-2">
    <ChevronLeft className="w-3.5 h-3.5" />
    Back to Recommendations
  </button>

  {/* Title Row */}
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-[26px] font-medium text-near-black">
          Recommendation <span className="font-mono text-gray-400 text-[22px]">{data.display_id}</span>
        </h1>
        <StatusBadge status={data.status} />
      </div>
      <p className="text-[13px] text-gray-500 mt-1">
        Created {formatDate(data.created_at)}
        {data.order?.display_id && <span> · Order {data.order.display_id}</span>}
      </p>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-2 shrink-0">
      {/* Share Button (replaces magic link bar) */}
      {data.magic_link && data.billing_mode !== 'doctor' && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white text-gray-600 px-4 py-2 text-[13px] font-medium hover:border-gray-300 hover:text-near-black transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share with Patient
            <ChevronDown className={\`w-3 h-3 transition-transform \${showShareMenu ? 'rotate-180' : ''}\`} />
          </button>

          {showShareMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] border border-gray-200 shadow-lg p-1.5 z-50 min-w-[200px]">
              <button
                onClick={() => {
                  const url = \`\${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/\${data.magic_link}\`;
                  handleCopy(url);
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={\`https://wa.me/?text=\${encodeURIComponent(\`Your lab test recommendation is ready: \${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)}/patient/\${data.magic_link}\`)}\`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href={\`mailto:\${data.patient?.email || ''}?subject=\${encodeURIComponent("Your Lab Test Recommendation")}&body=\${encodeURIComponent(\`Your lab test recommendation is ready: \${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)}/patient/\${data.magic_link}\`)}\`}
                onClick={() => setShowShareMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            </div>
          )}
        </div>
      )}

      {canResend && (
        <button
          onClick={handleSend}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#008085] text-white px-4 py-2 text-[13px] font-medium hover:bg-[#005C5F] transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          Resend
        </button>
      )}

      {canEdit && (
        <button
          onClick={() => router.push(\`/dashboard/recommendations/\${params.id}/edit\`)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white text-gray-600 px-4 py-2 text-[13px] font-medium hover:border-gray-300 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      )}

      {canDelete && (
        <button
          onClick={() => setDeleteModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white text-red-500 px-4 py-2 text-[13px] font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      )}
    </div>
  </div>

  {/* Status Timeline */}
  <div className="pt-4 pb-12 overflow-x-auto hide-scrollbar px-8 sm:px-12">
${timelineStr.substring(timelineStr.indexOf('{data.status ===')).replace(/<\/div>$/, '')}</div>

  {/* Stakeholder Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Patient Card */}
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[16px] font-heading font-medium text-primary">
            {(data.patient?.first_name?.[0] || '').toUpperCase()}{(data.patient?.last_name?.[0] || '').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Patient</div>
          <div className="text-[16px] font-heading font-medium text-near-black mt-0.5">
            {data.patient?.first_name} {data.patient?.last_name}
          </div>
          <div className="text-[13px] text-gray-500 mt-1 space-y-0.5">
            <div>{data.patient?.email || 'No email'}</div>
            {data.patient?.phone && <div>{data.patient.phone}</div>}
            <div>DOB: {data.patient?.date_of_birth ? formatDate(data.patient.date_of_birth) : 'N/A'}</div>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
          {getTierLabel(data.pricing_tier)}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-[12px] text-gray-400">Payment</div>
          <div className="text-[13px] font-medium text-near-black">
            {data.billing_mode === 'doctor' ? 'Doctor Invoice' : 'Patient Pays'}
          </div>
        </div>
        <div className="text-[20px] font-heading font-medium text-primary">
          €{Number(data.total_amount || 0).toFixed(2)}
        </div>
      </div>
    </div>

    {/* Collection & Delivery Card */}
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Collection & Delivery</div>
      <div className="text-[13px] space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Collection</span>
          <span className="font-medium text-near-black">{collectionLabels[data.collection_preference] || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Results Delivery</span>
          <span className="font-medium text-near-black">{deliveryLabels[data.results_delivery] || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Expected Blood Draw</span>
          <span className="font-medium text-near-black">{data.expected_appointment_date ? formatDate(data.expected_appointment_date) : 'TBD'}</span>
        </div>
      </div>
      {data.order?.status && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-gray-400">Order Status</div>
            <div className="text-[13px] font-medium text-near-black capitalize">{data.order.status.replace(/_/g, ' ')}</div>
          </div>
          <Link href={\`/dashboard/patients/\${data.patient_id}\`} className="text-[13px] text-primary hover:underline font-medium">
            View Patient →
          </Link>
        </div>
      )}
    </div>
  </div>

  {/* Tab Bar */}
  <div className="flex border-b border-gray-200 mb-6">
    {[
      { key: 'overview', label: 'Overview' },
      { key: 'shipping', label: 'Shipping' },
      { key: 'results', label: 'Results' },
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key as any)}
        className={\`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-1.5 \${
          activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-near-black'
        }\`}
      >
        {tab.label}
        {tab.key === 'results' && orderResults.length > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-emerald-100 text-emerald-600 rounded-full px-1">
            {orderResults.length}
          </span>
        )}
      </button>
    ))}
  </div>

  {/* Tab Content */}
  <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
    <div className="p-6">

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Selected Tests */}
          <div>
            <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Selected Tests</h3>
            <div className="space-y-2">
              {data.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
                  <div>
                    <div className="text-[14px] font-medium text-near-black flex items-center gap-2">
                      {item.test?.name || item.name || 'Deleted Test'}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#008085]/10 text-[#008085]">
                        {item.test_type === 'profile' ? 'Profile' : 'Parameter'}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-400 mt-0.5">
                      {item.test?.laboratory?.name || '—'}
                      {item.test?.sku && <span> · <span className="font-mono">{item.test.sku}</span></span>}
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-medium text-near-black">
                    €{Number(item.unit_price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Test costs</span>
                <span className="font-mono text-near-black">€{Number(data.test_costs_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Service fee ({data.service_fee_pct || 15}%)</span>
                <span className="font-mono text-near-black">€{Number(data.service_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Shipping</span>
                <span className="font-mono text-near-black">€{Number(data.shipping_estimate || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-mono text-near-black">€{(Number(data.test_costs_total || 0) + Number(data.service_fee || 0) + Number(data.shipping_estimate || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] mt-1">
                  <span className="text-gray-500">VAT (19%)</span>
                  <span className="font-mono text-near-black">€{Number(data.vat || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-medium text-near-black">Total</span>
                  <span className="text-[18px] font-heading font-medium text-primary">€{Number(data.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(data.anamnese_notes || data.internal_notes) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Notes</h3>
              {data.anamnese_notes && (
                <div className="mb-3">
                  <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-1">Anamnese</div>
                  <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-[8px] p-3">{data.anamnese_notes}</p>
                </div>
              )}
              {data.internal_notes && (
                <div>
                  <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-1">Internal</div>
                  <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-[8px] p-3">{data.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-4">
          {(() => {
            const shipments = data?.order?.shipments || [];
            if (shipments.length === 0) {
              return (
                <div className="py-10 text-center">
                  <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No shipments yet</p>
                  <p className="text-[12px] text-gray-300 mt-1">Shipments will appear once the order is prepared and shipped</p>
                </div>
              );
            }

            return shipments.map((shipment: any) => (
              <div key={shipment.id} className="rounded-[12px] border border-gray-200 overflow-hidden">
                {/* Lab Header */}
                <div className="px-5 py-3 bg-gray-50/50 flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-[14px] font-medium text-near-black">
                    {shipment.laboratory?.name || 'Unknown Lab'}
                  </span>
                  {shipment.laboratory?.address_city && (
                    <span className="text-[12px] text-gray-400">{shipment.laboratory.address_city}</span>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outbound: Kit to Patient */}
                  <div className="bg-gray-50 rounded-[12px] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[13px] font-medium text-near-black">Kit Delivery</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-auto">DHL</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={\`w-2 h-2 rounded-full \${
                        shipment.outbound_status === 'delivered' ? 'bg-emerald-500' :
                        shipment.outbound_status === 'shipped' ? 'bg-[#008085]' :
                        'bg-gray-300'
                      }\`} />
                      <span className="text-[13px] text-gray-700">
                        {shipment.outbound_status === 'pending' ? 'Being prepared' :
                         shipment.outbound_status === 'label_created' ? 'Label created' :
                         shipment.outbound_status === 'shipped' ? 'On its way to patient' :
                         shipment.outbound_status === 'delivered' ? 'Delivered ✓' :
                         shipment.outbound_status || 'Pending'}
                      </span>
                    </div>
                    {shipment.outbound_tracking_number && (
                      <div className="mt-2 flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400">Tracking:</span>
                        <span className="font-mono text-gray-600">{shipment.outbound_tracking_number}</span>
                        <a href={\`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=\${shipment.outbound_tracking_number}\`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#008085] font-medium flex items-center gap-1 ml-1">
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Return: Sample to Lab */}
                  <div className="bg-gray-50 rounded-[12px] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowLeft className="w-3.5 h-3.5 text-[#008085]" />
                      <span className="text-[13px] font-medium text-near-black">Sample Return</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-auto">
                        {shipment.shipping_method === 'gologistik' ? 'GoLogistik' : 'DHL'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={\`w-2 h-2 rounded-full \${
                        shipment.status === 'delivered' ? 'bg-emerald-500' :
                        ['in_transit', 'patient_sent', 'collected', 'scheduled'].includes(shipment.status) ? 'bg-[#008085]' :
                        'bg-gray-300'
                      }\`} />
                      <span className="text-[13px] text-gray-700">
                        {shipment.status === 'pending' ? 'Return label being prepared' :
                         shipment.status === 'label_created' ? 'Ready to send' :
                         shipment.status === 'patient_sent' ? 'Patient sent sample' :
                         shipment.status === 'in_transit' ? 'On its way to lab' :
                         shipment.status === 'delivered' ? 'Received by lab ✓' :
                         shipment.status === 'awaiting_schedule' ? 'Awaiting pickup schedule' :
                         shipment.status === 'scheduled' ? 'Pickup scheduled' :
                         shipment.status === 'collected' ? 'Sample collected' :
                         shipment.status || 'Pending'}
                      </span>
                    </div>
                    {shipment.tracking_number && (
                      <div className="mt-2 flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400">Tracking:</span>
                        <span className="font-mono text-gray-600">{shipment.tracking_number}</span>
                        <a href={\`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=\${shipment.tracking_number}\`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#008085] font-medium flex items-center gap-1 ml-1">
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {resultsLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : orderResults.length > 0 ? (
            <div className="space-y-3">
${innerResultsMap}
            </div>
          ) : (
            <div className="py-10 text-center">
              <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] text-gray-400">No results uploaded yet</p>
              <p className="text-[12px] text-gray-300 mt-1">Results will appear here once uploaded by the admin</p>
            </div>
          )}
        </div>
      )}

    </div>
  </div>\n\n`;

content = content.substring(0, returnIdx) + newReturnStr + content.substring(confirmModalIdx);

fs.writeFileSync(file, content);
console.log('Successfully updated the file.');
