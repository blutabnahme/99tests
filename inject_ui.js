const fs = require('fs');
const path = require('path');

const locales = ['en', 'de', 'es', 'nl', 'fr'];

const commonStrings = {
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  loading: "Loading...",
  error: "Error",
  success: "Success",
  previous: "Previous",
  next: "Next",
  search: "Search",
  admin: "ADMIN",
  all: "All",
  loadMore: "Load More",
  markAllRead: "Mark all read"
};

const uiStrings = {
  notifications: {
    title: "Notifications",
    subtitle: "Manage your alerts and activity updates.",
    markSelected: "Mark Selected",
    clearSelected: "Clear Selected",
    clearResolved: "Clear Resolved",
    allTypes: "All Types",
    unread: "Unread",
    filterType: "Filter Type",
    selectAll: "Select All",
    searchPlaceholder: "Search notifications...",
    noNotifications: "No notifications yet",
    allCaughtUp: "You're all caught up!",
    whenImportant: "We'll let you know when something important happens.",
    clearFilters: "Clear Filters",
    new: "New",
    resolve: "Resolve",
    resolved: "Resolved",
    view: "View",
    viewAll: "View all notifications",
    selectedText: "{count} selected",
    types: {
      new_opportunity: "New Opportunities",
      application_received: "Applications",
      case_update: "Case Updates",
      payment_received: "Payments",
      system_alert: "System Alerts"
    }
  },
  table: {
    noData: "No data found."
  }
};

for (const loc of locales) {
  const filePath = path.join(__dirname, 'messages', `${loc}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.endsWith('\n')) raw = raw.slice(0, -1);
  const data = JSON.parse(raw);
  
  if (!data.common) data.common = {};
  if (!data.ui) data.ui = {};
  if (!data.notifications) data.notifications = {};
  
  data.common = { ...data.common, ...commonStrings };
  data.ui = { ...data.ui, ...uiStrings, notifications: { ...data.ui.notifications, ...uiStrings.notifications }, table: { ...data.ui.table, ...uiStrings.table } };

  // For compatibility with the currently used t('notifications.title') in NotificationsView:
  data.notifications = { ...data.notifications, ...uiStrings.notifications };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('Successfully injected UI strings');
