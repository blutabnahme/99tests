const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements, needsIntl = true) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (needsIntl && !content.includes("useTranslations")) {
    // Add import statement after the last import
    const importMatch = content.match(/import .* from ['"].*['"];?\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + `import { useTranslations } from 'next-intl';\n`);
    } else {
      content = `import { useTranslations } from 'next-intl';\n` + content;
    }
  }

  // Add `const t = useTranslations();` hook inside the component function if needed
  if (needsIntl && !content.includes("const t = useTranslations")) {
    const fnMatch = content.match(/export (default )?function [A-Za-z0-9_]+\([^)]*\) \{/);
    if (fnMatch) {
      const fnDecl = fnMatch[0];
      content = content.replace(fnDecl, fnDecl + `\n  const t = useTranslations();\n  const tc = useTranslations('common');`);
    }
  }

  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }

  fs.writeFileSync(filePath, content);
}

// 1. NotificationBell.tsx
replaceInFile(
  path.join(__dirname, 'components/ui/NotificationBell.tsx'),
  [
    ['>Notifications</h3>', '>{t("ui.notifications.title")}</h3>'],
    ['Mark all read', '{tc("markAllRead")}'],
    ['>No notifications yet</p>', '>{t("ui.notifications.noNotifications")}</p>'],
    ['>We\'ll let you know when something important happens.</p>', '>{t("ui.notifications.whenImportant")}</p>'],
    ['>View all notifications', '>{t("ui.notifications.viewAll")}'],
    // Handle the function declaration to add `tc` properly:
    // actually, `replaceInFile` already adds it.
  ]
);

// 2. SidebarNav.tsx
replaceInFile(
  path.join(__dirname, 'components/ui/SidebarNav.tsx'),
  [
    ['>ADMIN', '>{tc("admin")}'],
    ['>\\n          ADMIN', '>\\n          {tc("admin")}']
  ]
);

// 3. ResponsiveTable.tsx
replaceInFile(
  path.join(__dirname, 'components/ui/ResponsiveTable.tsx'),
  [
    ['emptyMessage = \'No data found.\'', 'emptyMessage'],
    ['{emptyMessage}', '{emptyMessage || t("ui.table.noData")}']
  ]
);

// 4. NotificationsView.tsx
// This one already imports useTranslations, let's just make sure strings match
replaceInFile(
  path.join(__dirname, 'components/notifications/NotificationsView.tsx'),
  [
    ['"Mark Selected"', 't("ui.notifications.markSelected")'],
    ['"Clear Selected"', 't("ui.notifications.clearSelected")'],
    ['"Clear Resolved"', 't("ui.notifications.clearResolved")'],
    ['"System Alerts"', 't("ui.notifications.types.system_alert")'],
    ['"Payments"', 't("ui.notifications.types.payment_received")'],
    ['"Case Updates"', 't("ui.notifications.types.case_update")'],
    ['"Applications"', 't("ui.notifications.types.application_received")'],
    ['"New Opportunities"', 't("ui.notifications.types.new_opportunity")'],
    ['"When something important happens, you will see it here."', 't("ui.notifications.whenImportant")'],
    ['{selectedIds.length} selected', '{t("ui.notifications.selectedText", { count: selectedIds.length })}'],
    ['>New<', '>{t("ui.notifications.new")}<'],
    ['>Resolve', '>{t("ui.notifications.resolve")}'],
    ['>Resolved<', '>{t("ui.notifications.resolved")}<'],
    ['>View', '>{t("ui.notifications.view")}'],
    ['placeholder="Search notifications..."', 'placeholder={t("ui.notifications.searchPlaceholder")}'],
    ['label: "New Opportunities"', 'label: t("ui.notifications.types.new_opportunity")'],
    ['label: "Applications"', 'label: t("ui.notifications.types.application_received")'],
    ['label: "Case Updates"', 'label: t("ui.notifications.types.case_update")'],
    ['label: "Payments"', 'label: t("ui.notifications.types.payment_received")'],
    ['label: "System Alerts"', 'label: t("ui.notifications.types.system_alert")']
  ],
  false // Don't re-inject imports
);

console.log('Successfully injected TSX strings for Shared UI');
