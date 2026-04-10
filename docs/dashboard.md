# Dashboard

The MangoLab dashboard is your central control panel for monitoring your homelab. It is fully customizable with draggable widgets that can be arranged and sized to suit your workflow.

## Widget Types

MangoLab provides 12 widget types:

| Widget | Description | Size Options |
|---|---|---|
| **Service Status** | Shows the current status (UP/DOWN/DEGRADED) of a single service | Small, Medium |
| **Uptime Chart** | Uptime percentage bar chart for one or all services over a time range | Medium, Large |
| **Response Time** | Line chart of response time trends for a service | Medium, Large |
| **Service List** | Compact list of services with status indicators | Medium, Large |
| **Alert Summary** | Count of active alerts by severity (info, warning, critical) | Small, Medium |
| **Recent Alerts** | List of the most recent alert events | Medium, Large |
| **Log Stream** | Live-scrolling log viewer for a service or all services | Medium, Large |
| **Metric Chart** | Line/bar/area chart for a specific metric series (PRO) | Medium, Large |
| **Node Status** | Current status and resource info for a node (PRO) | Small, Medium |
| **Uptime Summary** | Overall uptime percentage across all services | Small |
| **Quick Stats** | Key numbers at a glance: total services, active alerts, average uptime | Small, Medium |
| **Clock** | Current date and time display | Small |

## Adding and Removing Widgets

### Adding a Widget

1. Click the **Edit Dashboard** button (pencil icon in the top-right corner)
2. Click **Add Widget**
3. Select the widget type from the list
4. Configure the widget:
   - Choose the data source (service, metric, time range)
   - Select the widget size
5. Click **Add**

The widget will appear in the next available position on the dashboard.

### Removing a Widget

1. Click **Edit Dashboard**
2. Hover over the widget you want to remove
3. Click the **X** button in the top-right corner of the widget
4. Click **Save Layout** to confirm

## Drag and Drop Rearrangement

While in edit mode:

1. Click and hold any widget
2. Drag it to the desired position
3. Other widgets will automatically reflow to make room
4. Release to drop the widget in its new position
5. Click **Save Layout** when you are satisfied

The layout uses a responsive grid system. Widgets snap to grid positions and automatically adjust when the browser window is resized.

## Widget Sizes

Each widget can be configured in one of three sizes:

| Size | Grid Columns | Best For |
|---|---|---|
| **Small** | 1 column | Status indicators, single values, quick stats |
| **Medium** | 2 columns | Charts, short lists, compact views |
| **Large** | 3 columns (full width) | Detailed charts, log streams, full lists |

To resize a widget:

1. Click **Edit Dashboard**
2. Click the settings (gear) icon on the widget
3. Select a new size
4. Click **Save Layout**

## Saving Layouts

Dashboard layouts are saved to the database and persist across sessions and devices.

- Click **Save Layout** after making changes in edit mode
- Changes are not saved automatically -- you must explicitly save
- If you navigate away without saving, your changes will be lost
- The layout is stored as JSON in the `DashboardLayout` model

## Multiple Dashboards (PRO)

PRO users can create and switch between multiple dashboards:

1. Click the dashboard name dropdown in the top-left
2. Click **New Dashboard**
3. Enter a name for the dashboard
4. Build the layout with widgets
5. Click **Save Layout**

Use cases for multiple dashboards:
- **Overview**: High-level status of all services
- **Infrastructure**: Detailed view of servers, networking, and databases
- **Applications**: Focus on web apps and APIs
- **Alerts**: Dedicated view for monitoring alert status

To set a default dashboard:
1. Navigate to the dashboard you want as default
2. Click **Settings > Set as Default**

## Default Layout

On first login, MangoLab provides a default layout with:

- **Quick Stats** widget (small) -- Total services, active alerts, average uptime
- **Service List** widget (large) -- All services with status
- **Uptime Chart** widget (medium) -- 24-hour uptime for all services
- **Recent Alerts** widget (medium) -- Latest alert events
- **Uptime Summary** widget (small) -- Overall uptime percentage

You can customize or replace this layout at any time.

## Dashboard Limits

| Feature | Free | PRO |
|---|---|---|
| Maximum widgets | 6 | 50 |
| Multiple dashboards | No | Yes |
| Custom widgets | No | Yes |
| Metric chart widgets | No | Yes |
| Node status widgets | No | Yes |

## Next Steps

- [Services](services.md) -- Add services to populate your dashboard
- [Uptime Monitoring](uptime-monitoring.md) -- Understand the data behind uptime widgets
- [Alerts](alerts.md) -- Configure alerts shown in alert widgets
- [Metrics](metrics.md) -- Ingest metrics for metric chart widgets
