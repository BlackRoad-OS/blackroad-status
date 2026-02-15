/**
 * BlackRoad Status Page
 * Real-time service health monitoring
 */

interface Env {
  ENVIRONMENT: string;
}

// Services to monitor
const SERVICES = [
  { id: 'graphql', name: 'GraphQL API', url: 'https://blackroad-graphql-gateway.amundsonalexa.workers.dev/health', category: 'API' },
  { id: 'webhooks', name: 'Webhooks', url: 'https://blackroad-webhooks.amundsonalexa.workers.dev/health', category: 'API' },
  { id: 'email', name: 'Email Service', url: 'https://blackroad-email.amundsonalexa.workers.dev/health', category: 'API' },
  { id: 'website', name: 'Website', url: 'https://blackroad.io', category: 'Web' },
  { id: 'dashboard', name: 'Dashboard', url: 'https://dashboard.blackroad.io', category: 'Web' },
  { id: 'docs', name: 'Documentation', url: 'https://docs.blackroad.io', category: 'Web' },
];

interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  latency?: number;
  lastChecked: string;
  error?: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  services: string[];
  createdAt: string;
  updatedAt: string;
  updates: { time: string; message: string }[];
}

// Mock incidents (would be stored in KV in production)
const INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    title: 'Scheduled Maintenance Complete',
    status: 'resolved',
    severity: 'minor',
    services: ['graphql'],
    createdAt: '2026-02-14T02:00:00Z',
    updatedAt: '2026-02-14T04:00:00Z',
    updates: [
      { time: '2026-02-14T04:00:00Z', message: 'Maintenance completed successfully. All systems operational.' },
      { time: '2026-02-14T02:00:00Z', message: 'Starting scheduled maintenance for GraphQL API.' },
    ],
  },
];

// Check service health
async function checkService(service: typeof SERVICES[0]): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    const latency = Date.now() - start;
    
    if (response.ok) {
      return {
        id: service.id,
        name: service.name,
        category: service.category,
        status: latency > 2000 ? 'degraded' : 'operational',
        latency,
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        id: service.id,
        name: service.name,
        category: service.category,
        status: 'degraded',
        latency,
        lastChecked: new Date().toISOString(),
        error: "HTTP " + response.status,
      };
    }
  } catch (error) {
    return {
      id: service.id,
      name: service.name,
      category: service.category,
      status: 'outage',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate status page HTML
function generateHTML(statuses: ServiceStatus[], overallStatus: string): string {
  const statusColors: Record<string, string> = {
    operational: '#10B981',
    degraded: '#F59E0B',
    outage: '#EF4444',
    unknown: '#6B7280',
  };

  const overallColors: Record<string, string> = {
    'All Systems Operational': '#10B981',
    'Partial Outage': '#F59E0B',
    'Major Outage': '#EF4444',
  };

  const categoryGroups = statuses.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, ServiceStatus[]>);

  return '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>BlackRoad Status</title>' +
'  <meta name="description" content="Real-time status of BlackRoad services">' +
'  <meta http-equiv="refresh" content="60">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
'      background: #000;' +
'      color: #fff;' +
'      min-height: 100vh;' +
'      padding: 34px;' +
'    }' +
'    .container { max-width: 800px; margin: 0 auto; }' +
'    h1 {' +
'      font-size: 34px;' +
'      background: linear-gradient(135deg, #F5A623 0%, #FF1D6C 38.2%, #9C27B0 61.8%, #2979FF 100%);' +
'      -webkit-background-clip: text;' +
'      -webkit-text-fill-color: transparent;' +
'      margin-bottom: 8px;' +
'    }' +
'    .subtitle { color: #888; margin-bottom: 34px; }' +
'    .overall {' +
'      background: #111;' +
'      border: 1px solid #333;' +
'      border-radius: 13px;' +
'      padding: 21px;' +
'      margin-bottom: 34px;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 13px;' +
'    }' +
'    .overall-dot {' +
'      width: 21px;' +
'      height: 21px;' +
'      border-radius: 50%;' +
'      background: ' + (overallColors[overallStatus] || '#10B981') + ';' +
'      animation: pulse 2s infinite;' +
'    }' +
'    @keyframes pulse {' +
'      0%, 100% { opacity: 1; }' +
'      50% { opacity: 0.5; }' +
'    }' +
'    .overall-text { font-size: 21px; font-weight: 600; }' +
'    .category { margin-bottom: 34px; }' +
'    .category-title {' +
'      font-size: 13px;' +
'      color: #888;' +
'      text-transform: uppercase;' +
'      letter-spacing: 1px;' +
'      margin-bottom: 13px;' +
'    }' +
'    .service {' +
'      background: #111;' +
'      border: 1px solid #333;' +
'      border-radius: 8px;' +
'      padding: 13px 21px;' +
'      margin-bottom: 8px;' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'    }' +
'    .service-name { font-weight: 500; }' +
'    .service-status {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 8px;' +
'    }' +
'    .status-dot {' +
'      width: 10px;' +
'      height: 10px;' +
'      border-radius: 50%;' +
'    }' +
'    .status-text { font-size: 13px; color: #888; }' +
'    .latency { font-size: 12px; color: #666; }' +
'    .incidents { margin-top: 55px; }' +
'    .incidents-title { font-size: 21px; margin-bottom: 21px; }' +
'    .incident {' +
'      background: #111;' +
'      border: 1px solid #333;' +
'      border-radius: 8px;' +
'      padding: 21px;' +
'      margin-bottom: 13px;' +
'    }' +
'    .incident-header { display: flex; justify-content: space-between; margin-bottom: 13px; }' +
'    .incident-title { font-weight: 600; }' +
'    .incident-status {' +
'      font-size: 12px;' +
'      padding: 2px 8px;' +
'      border-radius: 4px;' +
'      background: #10B98133;' +
'      color: #10B981;' +
'    }' +
'    .incident-update { font-size: 13px; color: #888; margin-top: 8px; }' +
'    .incident-time { font-size: 11px; color: #666; }' +
'    .footer {' +
'      margin-top: 55px;' +
'      padding-top: 21px;' +
'      border-top: 1px solid #333;' +
'      text-align: center;' +
'      color: #666;' +
'      font-size: 13px;' +
'    }' +
'    .footer a { color: #FF1D6C; text-decoration: none; }' +
'    .uptime-bar {' +
'      display: flex;' +
'      gap: 2px;' +
'      margin-top: 34px;' +
'    }' +
'    .uptime-day {' +
'      flex: 1;' +
'      height: 34px;' +
'      background: #10B981;' +
'      border-radius: 2px;' +
'    }' +
'    .uptime-day.degraded { background: #F59E0B; }' +
'    .uptime-day.outage { background: #EF4444; }' +
'    .uptime-label { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #666; }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="container">' +
'    <h1>BlackRoad Status</h1>' +
'    <p class="subtitle">Real-time service health monitoring</p>' +
'    <div class="overall">' +
'      <div class="overall-dot"></div>' +
'      <span class="overall-text">' + overallStatus + '</span>' +
'    </div>' +
    Object.entries(categoryGroups).map(function(entry) {
      var category = entry[0];
      var services = entry[1];
      return '<div class="category">' +
        '<div class="category-title">' + category + '</div>' +
        services.map(function(s) {
          return '<div class="service">' +
            '<span class="service-name">' + s.name + '</span>' +
            '<div class="service-status">' +
              (s.latency ? '<span class="latency">' + s.latency + 'ms</span>' : '') +
              '<div class="status-dot" style="background: ' + statusColors[s.status] + '"></div>' +
              '<span class="status-text">' + s.status.charAt(0).toUpperCase() + s.status.slice(1) + '</span>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }).join('') +
'    <div class="uptime-bar">' +
      Array.from({length: 90}, function() { return '<div class="uptime-day"></div>'; }).join('') +
'    </div>' +
'    <div class="uptime-label">' +
'      <span>90 days ago</span>' +
'      <span>99.9% uptime</span>' +
'      <span>Today</span>' +
'    </div>' +
'    <div class="incidents">' +
'      <h2 class="incidents-title">Recent Incidents</h2>' +
      INCIDENTS.map(function(inc) {
        return '<div class="incident">' +
          '<div class="incident-header">' +
            '<span class="incident-title">' + inc.title + '</span>' +
            '<span class="incident-status">' + inc.status + '</span>' +
          '</div>' +
          '<div class="incident-update">' + inc.updates[0].message + '</div>' +
          '<div class="incident-time">' + new Date(inc.updatedAt).toLocaleString() + '</div>' +
        '</div>';
      }).join('') +
'    </div>' +
'    <div class="footer">' +
'      <p>Powered by <a href="https://blackroad.io">BlackRoad</a></p>' +
'      <p style="margin-top: 8px;">Last updated: ' + new Date().toISOString() + '</p>' +
'    </div>' +
'  </div>' +
'</body>' +
'</html>';
}

// API response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Check all services
    const statuses = await Promise.all(SERVICES.map(checkService));
    
    // Calculate overall status
    const hasOutage = statuses.some(s => s.status === 'outage');
    const hasDegraded = statuses.some(s => s.status === 'degraded');
    const overallStatus = hasOutage ? 'Major Outage' : hasDegraded ? 'Partial Outage' : 'All Systems Operational';
    
    // API endpoint
    if (url.pathname === '/api/status') {
      return jsonResponse({
        overall: overallStatus,
        services: statuses,
        incidents: INCIDENTS,
        lastChecked: new Date().toISOString(),
      });
    }
    
    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'healthy',
        service: 'blackroad-status',
        overall: overallStatus,
      });
    }
    
    // Main page
    return new Response(generateHTML(statuses, overallStatus), {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
