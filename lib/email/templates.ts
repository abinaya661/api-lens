export function budgetAlertEmail(userName: string, budgetScope: string, percentage: number, spent: string, budget: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Budget Alert — ${percentage}% Reached</h2>
      <p>Hi ${userName},</p>
      <p>Your <strong>${budgetScope}</strong> budget has reached <strong>${percentage}%</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Spent</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${spent}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Budget</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${budget}</td></tr>
      </table>
      <p><a href="https://apilens.tech/budgets" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Budgets</a></p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}

export function keyRotationEmail(userName: string, keyNickname: string, provider: string, ageDays: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Key Rotation Reminder</h2>
      <p>Hi ${userName},</p>
      <p>Your <strong>${provider}</strong> key "<strong>${keyNickname}</strong>" is <strong>${ageDays} days old</strong>.</p>
      <p>We recommend rotating API keys every 90 days for security best practices.</p>
      <p><a href="https://apilens.tech/keys" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">Manage Keys</a></p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}

export function welcomeEmail(userName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Welcome to API Lens!</h2>
      <p>Hi ${userName},</p>
      <p>Thanks for signing up! Your 7-day free trial has started.</p>
      <p>Here's what you can do:</p>
      <ul style="line-height: 2;">
        <li>Add your AI API keys to start tracking spending</li>
        <li>Set budgets with smart alerts</li>
        <li>View real-time cost breakdowns by provider and model</li>
        <li>Export detailed usage reports</li>
      </ul>
      <p><a href="https://apilens.tech/dashboard" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}

export function getWeeklyReportEmailHtml({
  weekLabel,
  totalSpent,
  totalSpentPrev,
  providerBreakdown,
  projectBreakdown,
}: {
  weekLabel: string;
  totalSpent: string;
  totalSpentPrev: string;
  providerBreakdown: { provider: string; spent: string }[];
  projectBreakdown: { name: string; spent: string }[];
}): string {
  const currentNum = parseFloat(totalSpent.replace(/[^0-9.-]/g, ''));
  const prevNum = parseFloat(totalSpentPrev.replace(/[^0-9.-]/g, ''));
  const diff = currentNum - prevNum;
  const diffPct = prevNum > 0 ? Math.round(Math.abs(diff / prevNum) * 100) : 0;
  const diffLabel = diff > 0 ? `+${diffPct}% vs last week` : diff < 0 ? `-${diffPct}% vs last week` : 'same as last week';
  const diffColor = diff > 0 ? '#dc2626' : diff < 0 ? '#16a34a' : '#666666';

  const providerRows = providerBreakdown.map(p =>
    `<tr>
      <td style="padding: 8px 4px; border-bottom: 1px solid #eee;">${p.provider}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${p.spent}</td>
    </tr>`
  ).join('');

  const projectSection = projectBreakdown.length > 0
    ? `<h3 style="color: #1a1a2e; font-size: 16px; margin: 24px 0 8px 0;">By Project</h3>
       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
         ${projectBreakdown.map(p =>
           `<tr>
             <td style="padding: 8px 4px; border-bottom: 1px solid #eee;">${p.name}</td>
             <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${p.spent}</td>
           </tr>`
         ).join('')}
       </table>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Weekly API Spending Report</h2>
      <p>Here&rsquo;s your spending summary for <strong>${weekLabel}</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0 24px 0;">
        <tr>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee;">Total Spent</td>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 18px;">${totalSpent}</td>
        </tr>
        <tr>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee;">Previous Week</td>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee; text-align: right;">
            ${totalSpentPrev} &nbsp;<span style="color: ${diffColor}; font-size: 12px;">(${diffLabel})</span>
          </td>
        </tr>
      </table>
      <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 8px 0;">By Provider</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${providerRows}
      </table>
      ${projectSection}
      <p>
        <a href="https://apilens.tech/dashboard/reports" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Full Report</a>
      </p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}

export function getMonthlyReportEmailHtml({
  monthLabel,
  totalSpent,
  providerBreakdown,
  projectBreakdown,
}: {
  monthLabel: string;
  totalSpent: string;
  providerBreakdown: { provider: string; spent: string }[];
  projectBreakdown: { name: string; spent: string }[];
}): string {
  const providerRows = providerBreakdown.map(p =>
    `<tr>
      <td style="padding: 8px 4px; border-bottom: 1px solid #eee;">${p.provider}</td>
      <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${p.spent}</td>
    </tr>`
  ).join('');

  const projectSection = projectBreakdown.length > 0
    ? `<h3 style="color: #1a1a2e; font-size: 16px; margin: 24px 0 8px 0;">By Project</h3>
       <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
         ${projectBreakdown.map(p =>
           `<tr>
             <td style="padding: 8px 4px; border-bottom: 1px solid #eee;">${p.name}</td>
             <td style="padding: 8px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${p.spent}</td>
           </tr>`
         ).join('')}
       </table>`
    : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Monthly API Spending Report &mdash; ${monthLabel}</h2>
      <p>Here&rsquo;s your complete spending summary for <strong>${monthLabel}</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0 24px 0;">
        <tr>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee;">Total Spent</td>
          <td style="padding: 10px 4px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; font-size: 18px;">${totalSpent}</td>
        </tr>
      </table>
      <h3 style="color: #1a1a2e; font-size: 16px; margin: 0 0 8px 0;">By Provider</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${providerRows}
      </table>
      ${projectSection}
      <p>
        <a href="https://apilens.tech/dashboard/reports" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Full Report</a>
      </p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}

export function weeklyReportEmail(userName: string, totalSpent: string, topProvider: string, topProviderSpent: string, keyCount: number): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1a1a2e;">Your Weekly API Spending Report</h2>
      <p>Hi ${userName},</p>
      <p>Here's your spending summary for the past week:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Total Spent</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${totalSpent}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Top Provider</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${topProvider} (${topProviderSpent})</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Active Keys</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${keyCount}</td></tr>
      </table>
      <p><a href="https://apilens.tech/reports" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Full Report</a></p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}
