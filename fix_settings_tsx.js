const fs = require('fs');

let content = fs.readFileSync('c:/Blutabnahme/app/dashboard/settings/page.tsx', 'utf8');

// Replace standard translations hook
content = content.replace(/const t = useTranslations\(\);/g, "const t = useTranslations('hc.settings');");

// Fix SaveBar translating hook specifically
content = content.replace(/function SaveBar[\s\S]*?const t = useTranslations\('hc\.settings'\);/g, (match) => {
  return match.replace("'hc.settings'", "'common'");
});
content = content.replace(/t\('common\.save'\)/g, "t('save')");

// Update t('settings.xxx') -> t('xxx')
content = content.replace(/t\('settings\./g, "t('");

// Update Tab Logic
content = content.replace(/tab\.id === 'notifications' \? 'Notifications' : t\(`\$\{tab\.id/g, 
  "tab.id === 'notifications' ? t('notificationsTab') : t(`${tab.id");

// Profile Tab
content = content.replace(/'Company Profile updated successfully!'/g, "t('toastProfileUpdated')");
content = content.replace(/Translations are being progressively added\. Some pages may appear in English\./g, "{t('languageDisclaimer')}");

// Security Tab inline auth fallback
content = content.replace(/t\('auth\.password'\)/g, "useTranslations('auth')('password')");
content = content.replace(/'Password change will be available once email verification is configured\.'/g, "t('passwordAlert')");
content = content.replace(/'MFA setup coming soon\.'/g, "t('mfaAlert')");

// Billing
content = content.replace(/>Invoice \(monthly\)</g, ">{t('invoiceMonthly')}<");
content = content.replace(/>Monthly, net 30 days</g, ">{t('monthlyNet30')}<");

// API
content = content.replace(/'Failed to revoke key'/g, "t('revokeFailed')");
content = content.replace(/'An error occurred'/g, "t('errorOccurred')");
content = content.replace(/'Are you sure you want to revoke this API key\? This cannot be undone\.'/g, "t('revokeConfirm')");
content = content.replace(/'Failed to generate key'/g, "t('generateFailed')");
content = content.replace(/"e\.g\. EHR Integration, Lab Sync"/g, "{t('keyPlaceholder')}");
content = content.replace(/'Generating\.\.\.'/g, "t('generating')");
content = content.replace(/'Generate Key'/g, "t('generateKeyBtn')");

// API Cancel Button
content = content.replace(/\{t\('common\.cancel'\)\}/g, "{useTranslations('common')('cancel')}");

fs.writeFileSync('c:/Blutabnahme/app/dashboard/settings/page.tsx', content);
console.log('Settings component UI replaced cleanly.');
