# 🛡️ Jarvish Command Center

**Status:** In Progress (Phase 1 & 2 Completed)
**Description:** An advanced personal productivity dashboard that operates at the OS level to block network traffic and eliminate distractions.

## ⚙️ Core Architecture
* **Dual-Engine Setup:** 
  * Frontend: React / Next.js (TypeScript, Tailwind CSS) running on port 3000.
  * Backend: Python (Flask) local server running on port 5000.


  ## 🚀 Key Features: The Kill-Switch
* **System-Level Blocking:** The Python backend requires Administrator privileges to modify the Windows `C:\Windows\System32\drivers\etc\hosts` file.
* **Network Override:** Successfully bypasses Secure DNS (DNS-over-HTTPS) and internal browser socket caching to achieve absolute network blocking.