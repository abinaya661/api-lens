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
      <p><a href="https://apilens.dev/budgets" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Budgets</a></p>
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
      <p><a href="https://apilens.dev/keys" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">Manage Keys</a></p>
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
      <p><a href="https://apilens.dev/dashboard" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a></p>
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
      <p><a href="https://apilens.dev/reports" style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">View Full Report</a></p>
      <p style="color: #666; font-size: 12px;">— API Lens</p>
    </div>
  `;
}
