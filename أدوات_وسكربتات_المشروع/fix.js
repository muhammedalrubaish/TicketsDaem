const fs = require("fs");

let tsx = fs.readFileSync("app/DashboardClient.tsx", "utf8");

// Robust regex to match the getStatusColor function completely
const getStatusColorRegex = /const getStatusColor\s*=\s*\(status:\s*string\)\s*=>\s*\{[\s\S]*?\};/;

const newGetStatusColor = `const getStatusColor = (status: string) => {
    switch (status) {
      case 'بلاغ جديد': return '#8b5cf6';
      case 'بانتظار المستفيد': return '#ec4899';
      case 'لدى الوزارة': return '#f59e0b';
      case 'مشكلة عامة': return '#0ea5e9';
      case 'لم يتم الحل': return '#ef4444';
      case 'تم الحل': return '#10b981';
      case 'مجاز': return '#6b7280';
      default: return 'var(--primary)';
    }
  };`;

if (getStatusColorRegex.test(tsx)) {
  tsx = tsx.replace(getStatusColorRegex, newGetStatusColor);
  fs.writeFileSync("app/DashboardClient.tsx", tsx, "utf8");
  console.log("SUCCESS: getStatusColor has been completely replaced and corrected in perfect UTF-8!");
} else {
  console.log("ERROR: Could not find getStatusColor function using Regex!");
}
