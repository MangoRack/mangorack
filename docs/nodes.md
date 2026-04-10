# Nodes (PRO)

Nodes represent the physical or virtual machines, containers, and cloud instances that run your homelab services. Node tracking is a PRO feature that lets you map services to their underlying infrastructure.

## What Are Nodes

A node is a compute resource in your homelab. It could be:

- A **physical server** (bare-metal machine)
- A **virtual machine** (Proxmox VM, VMware, VirtualBox)
- A **container** (Docker, LXC)
- A **cloud instance** (AWS EC2, Hetzner, DigitalOcean)

Each node records hardware details, network information, and its relationship to the services running on it.

## Adding Nodes

### From the UI

1. Navigate to **Nodes** in the main navigation
2. Click **Add Node**
3. Fill in the node details:

| Field | Required | Description |
|---|---|---|
| **Name** | Yes | A human-readable name (e.g., "homelab-01", "proxmox-vm-03") |
| **Description** | No | What this node is used for |
| **Type** | Yes | PHYSICAL, VIRTUAL, CONTAINER, or CLOUD |
| **Hostname** | No | Network hostname (e.g., "homelab-01.local") |
| **IP Address** | No | Primary IP address (e.g., "192.168.1.100") |
| **OS** | No | Operating system (e.g., "Debian 12", "Ubuntu 24.04") |
| **CPU** | No | CPU model or description (e.g., "Intel i7-12700K") |
| **RAM** | No | RAM capacity (e.g., "64 GB DDR5") |
| **Storage** | No | Storage capacity (e.g., "2 TB NVMe") |
| **Tags** | No | Labels for organization (e.g., "primary", "production") |

4. Click **Save**

### Node Types

| Type | Description | Examples |
|---|---|---|
| `PHYSICAL` | Bare-metal hardware you own | Dell PowerEdge, custom-built server, Raspberry Pi |
| `VIRTUAL` | Virtual machine running on a hypervisor | Proxmox VM, VMware ESXi VM, Hyper-V VM |
| `CONTAINER` | Containerized environment | Docker host, LXC container |
| `CLOUD` | Cloud-hosted instance | AWS EC2, Hetzner Cloud, DigitalOcean Droplet |

## Assigning Services to Nodes

After creating a node, you can assign services to it:

### When creating a service

1. In the service creation form, select a node from the **Node** dropdown
2. Save the service

### For existing services

1. Navigate to the service detail page
2. Click **Edit**
3. Select a node from the **Node** dropdown
4. Click **Save**

### From the node detail page

1. Navigate to the node detail page
2. Click **Assign Service**
3. Select one or more services from the list
4. Click **Save**

## Node Resource Monitoring

The node detail page shows:

- **Node information**: Name, type, hostname, IP, OS, hardware specs
- **Assigned services**: List of services running on this node with their current status
- **Service health summary**: How many services are UP, DOWN, DEGRADED on this node
- **Tags**: All tags associated with the node

To track detailed resource metrics (CPU, memory, disk) for a node, assign a service of type **Custom** to the node and push metrics to it via the [metrics ingestion API](metrics.md).

## Node Management

### Editing a Node

1. Navigate to the node detail page
2. Click **Edit**
3. Update any fields
4. Click **Save**

### Deactivating a Node

If a node is temporarily offline (maintenance, migration), you can deactivate it:

1. Navigate to the node detail page
2. Toggle **Active** off

Deactivated nodes remain in the system but are visually distinguished. Services assigned to deactivated nodes continue to be monitored normally.

### Deleting a Node

1. Navigate to the node detail page
2. Click **Delete Node**
3. Confirm the deletion

> **Note:** Deleting a node does not delete its assigned services. The services will simply no longer be associated with any node.

## Node Limits

| Feature | Free | PRO |
|---|---|---|
| Maximum nodes | 1 | 20 |
| Node tracking | No | Yes |

## Best Practices

1. **Name nodes consistently**: Use a naming convention like `location-type-number` (e.g., "rack1-physical-01", "cloud-vm-03").

2. **Document hardware specs**: Fill in the CPU, RAM, and storage fields -- it helps when planning capacity or troubleshooting resource issues.

3. **Use tags for organization**: Tags like "production", "staging", "gpu", "high-memory" help filter and group nodes.

4. **Map all services**: Assigning services to nodes gives you a clear picture of what runs where and helps identify single points of failure.

## Next Steps

- [Services](services.md) -- Add services and assign them to nodes
- [Metrics](metrics.md) -- Push resource metrics for nodes
- [Dashboard](dashboard.md) -- Add node status widgets to your dashboard
