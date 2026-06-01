"use client";

import { ChangeEvent, useMemo, useState } from "react";

type WanConnectionType = "static" | "dhcp" | "pppoe";

type BasicFortigateForm = {
  wanInterface: string;
  wanConnectionType: WanConnectionType;
  wanIpAddress: string;
  wanSubnetMask: string;
  wanGateway: string;
  pppoeUsername: string;
  pppoePassword: string;
  lanInterface: string;
  lanIpAddress: string;
  lanSubnetMask: string;
  dhcpStartIp: string;
  dhcpEndIp: string;
  dnsPrimary: string;
  dnsSecondary: string;
  dhcpGateway: string;
  enableSslVpn: boolean;
  vpnUserGroup: string;
  vpnTunnelIpPool: string;
  vpnAllowedLanSubnet: string;
  vpnPortalName: string;
};

type StepItem = {
  id: string;
  label: string;
  detail: string;
};

const inputClass =
  "w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-cyan-500/50 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10";
const labelClass = "mb-2 block text-sm font-semibold text-slate-100";
const helperClass = "mt-2 block text-xs leading-5 text-slate-400";

const defaultForm: BasicFortigateForm = {
  wanInterface: "wan1",
  wanConnectionType: "static",
  wanIpAddress: "203.0.113.10",
  wanSubnetMask: "255.255.255.248",
  wanGateway: "203.0.113.9",
  pppoeUsername: "isp-user@example",
  pppoePassword: "change-me",
  lanInterface: "lan",
  lanIpAddress: "192.168.1.1",
  lanSubnetMask: "255.255.255.0",
  dhcpStartIp: "192.168.1.100",
  dhcpEndIp: "192.168.1.200",
  dnsPrimary: "8.8.8.8",
  dnsSecondary: "1.1.1.1",
  dhcpGateway: "192.168.1.1",
  enableSslVpn: false,
  vpnUserGroup: "SSLVPN_Users",
  vpnTunnelIpPool: "SSLVPN_TUNNEL_ADDR1",
  vpnAllowedLanSubnet: "192.168.1.0 255.255.255.0",
  vpnPortalName: "full-access",
};

const stepNavigation: StepItem[] = [
  { id: "wan", label: "1 WAN", detail: "Internet uplink" },
  { id: "lan", label: "2 LAN", detail: "Internal gateway" },
  { id: "dhcp", label: "3 DHCP", detail: "Client IP service" },
  { id: "policy", label: "4 Firewall Policy", detail: "LAN to Internet" },
  { id: "nat-dns", label: "5 NAT / DNS / Gateway", detail: "Route and resolver" },
  { id: "vpn", label: "6 VPN", detail: "Optional SSL VPN" },
  { id: "checklist", label: "7 Checklist", detail: "Firmware and testing" },
  { id: "export", label: "8 Export Config", detail: "Copy or .txt" },
];

const firmwareChecklist = [
  "ตรวจสอบเวอร์ชัน Firmware ปัจจุบันก่อนเริ่มงาน",
  "อัปเกรดเป็นเวอร์ชัน Stable ที่เหมาะสมกับรุ่นและนโยบายขององค์กร",
  "Backup Configuration หลังติดตั้งและตรวจสอบระบบเสร็จ",
];

const testingChecklist = [
  "ทดสอบการออกอินเทอร์เน็ตจากเครื่อง Client",
  "ทดสอบการ Resolve DNS เช่น เปิดเว็บไซต์หรือ nslookup",
  "ทดสอบ Ping ไปยัง Gateway ของ LAN",
  "ตรวจสอบ Log ของ Policy บน FortiGate ว่ามี Traffic ผ่านถูกต้อง",
  "Backup Final Config หลังทดสอบผ่านทั้งหมด",
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className={helperClass}>{hint}</span> : null}
    </label>
  );
}

function ModuleCard({ id, icon, title, description, children }: { id: string; icon: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-[2rem] border border-slate-700/70 bg-slate-900/75 p-5 shadow-2xl shadow-slate-950/40 ring-1 ring-white/5 backdrop-blur md:p-6">
      <div className="mb-6 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-2xl shadow-lg shadow-cyan-950/40">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm text-slate-200">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/55 p-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-300/60 bg-cyan-300/10 text-xs text-cyan-100">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-bold text-slate-100">{value}</p>
    </div>
  );
}

function getWanModeLabel(type: WanConnectionType) {
  if (type === "dhcp") return "DHCP จากผู้ให้บริการ";
  if (type === "pppoe") return "PPPoE ด้วย Username/Password";
  return "Static IP จากผู้ให้บริการ";
}

function getGeneratedSectionCount(enableSslVpn: boolean) {
  return enableSslVpn ? 8 : 7;
}

function buildWanCli(form: BasicFortigateForm) {
  const baseLines = [
    "config system interface",
    `    edit "${form.wanInterface}"`,
    "        set role wan",
    "        set allowaccess ping",
  ];

  if (form.wanConnectionType === "dhcp") {
    baseLines.push("        set mode dhcp");
  }

  if (form.wanConnectionType === "pppoe") {
    baseLines.push(
      "        set mode pppoe",
      `        set username "${form.pppoeUsername}"`,
      `        set password "${form.pppoePassword}"`,
    );
  }

  if (form.wanConnectionType === "static") {
    baseLines.push("        set mode static", `        set ip ${form.wanIpAddress} ${form.wanSubnetMask}`);
  }

  baseLines.push("    next", "end");
  return baseLines.join("\n");
}

function buildDefaultRouteCli(form: BasicFortigateForm) {
  if (form.wanConnectionType !== "static") {
    return `# WAN เป็น ${getWanModeLabel(form.wanConnectionType)} โดยทั่วไป Default Route จะได้รับจาก ISP อัตโนมัติ\n# หาก ISP ไม่ส่ง Route ให้เพิ่ม Static Route ตามข้อมูลจริงของผู้ให้บริการ`;
  }

  return `config router static\n    edit 1\n        set gateway ${form.wanGateway}\n        set device "${form.wanInterface}"\n    next\nend`;
}

function buildVpnCli(form: BasicFortigateForm) {
  if (!form.enableSslVpn) {
    return "# ไม่ได้เปิด SSL VPN จึงไม่สร้างคำสั่งส่วน VPN";
  }

  return `# สร้าง Address สำหรับ LAN ที่อนุญาตให้ผู้ใช้ VPN เข้าถึง\nconfig firewall address\n    edit "LAN_SUBNET_FOR_SSLVPN"\n        set subnet ${form.vpnAllowedLanSubnet}\n    next\nend\n\n# ตั้งค่า SSL VPN Portal แบบพื้นฐาน\nconfig vpn ssl web portal\n    edit "${form.vpnPortalName}"\n        set tunnel-mode enable\n        set split-tunneling enable\n        set ip-pools "${form.vpnTunnelIpPool}"\n    next\nend\n\n# ผูก User Group กับ Portal\nconfig vpn ssl settings\n    set servercert "Fortinet_Factory"\n    set tunnel-ip-pools "${form.vpnTunnelIpPool}"\n    set source-interface "${form.wanInterface}"\n    set source-address "all"\n    set default-portal "${form.vpnPortalName}"\n    config authentication-rule\n        edit 1\n            set groups "${form.vpnUserGroup}"\n            set portal "${form.vpnPortalName}"\n        next\n    end\nend\n\n# Policy ให้ผู้ใช้ SSL VPN เข้าถึง LAN\nconfig firewall policy\n    edit 0\n        set name "SSLVPN_to_LAN"\n        set srcintf "ssl.root"\n        set dstintf "${form.lanInterface}"\n        set srcaddr "all"\n        set dstaddr "LAN_SUBNET_FOR_SSLVPN"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n        set logtraffic all\n        set nat disable\n    next\nend`;
}

function buildConfig(form: BasicFortigateForm) {
  return `# FortiRule Builder - Basic FortiGate First Implementation\n# คอนฟิกนี้สร้างจากหน้าเว็บฝั่ง Frontend เท่านั้น ไม่มีการเชื่อมต่อ FortiGate จริง\n# ตรวจสอบค่าอีกครั้งก่อนนำไปใช้กับอุปกรณ์จริง\n\n# ส่วนที่ 1: WAN Internet Setup\n# คำอธิบาย: ตั้งค่า ${form.wanInterface} เป็นขาออกอินเทอร์เน็ตแบบ ${getWanModeLabel(form.wanConnectionType)}\n${buildWanCli(form)}\n\n# ส่วนที่ 2: LAN Setup\n# คำอธิบาย: ตั้งค่า ${form.lanInterface} เป็น Gateway ของเครือข่ายภายใน\nconfig system interface\n    edit "${form.lanInterface}"\n        set role lan\n        set mode static\n        set ip ${form.lanIpAddress} ${form.lanSubnetMask}\n        set allowaccess ping https ssh\n    next\nend\n\n# ส่วนที่ 3: DHCP Server\n# คำอธิบาย: แจก IP ให้ Client ใน LAN พร้อม Gateway และ DNS\nconfig system dhcp server\n    edit 1\n        set interface "${form.lanInterface}"\n        set default-gateway ${form.dhcpGateway}\n        set netmask ${form.lanSubnetMask}\n        set dns-service specify\n        set dns-server1 ${form.dnsPrimary}\n        set dns-server2 ${form.dnsSecondary}\n        config ip-range\n            edit 1\n                set start-ip ${form.dhcpStartIp}\n                set end-ip ${form.dhcpEndIp}\n            next\n        end\n    next\nend\n\n# ส่วนที่ 4: DNS and Default Gateway\n# คำอธิบาย: ตั้งค่า DNS ของ FortiGate และ Default Route สำหรับออกอินเทอร์เน็ต\nconfig system dns\n    set primary ${form.dnsPrimary}\n    set secondary ${form.dnsSecondary}\nend\n\n${buildDefaultRouteCli(form)}\n\n# ส่วนที่ 5: Basic Firewall Policy - LAN to Internet\n# คำอธิบาย: อนุญาตให้ LAN ออก Internet ได้ทุก Service และเปิด NAT เพื่อแปลง IP ภายในเป็น IP ขา WAN\nconfig firewall policy\n    edit 0\n        set name "LAN_to_Internet"\n        set srcintf "${form.lanInterface}"\n        set dstintf "${form.wanInterface}"\n        set srcaddr "all"\n        set dstaddr "all"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n        set logtraffic all\n        set nat enable\n    next\nend\n\n# ส่วนที่ 6: Optional SSL VPN\n# คำอธิบาย: ส่วนนี้ใช้เมื่อเปิด Toggle SSL VPN เท่านั้น และเป็น Template พื้นฐานสำหรับให้ VPN เข้าถึง LAN\n${buildVpnCli(form)}\n\n# ส่วนที่ 7: Firmware and Backup Checklist\n# คำอธิบาย: รายการนี้เป็น Checklist เท่านั้น ไม่สร้างคำสั่งอัปเกรด Firmware จริง\n${firmwareChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}\n\n# ส่วนที่ 8: Testing Checklist\n# คำอธิบาย: ใช้ตรวจสอบหลังติดตั้งเสร็จสำหรับ Engineer มือใหม่\n${testingChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}`;
}

export default function Home() {
  const [form, setForm] = useState<BasicFortigateForm>(defaultForm);
  const [copyLabel, setCopyLabel] = useState("คัดลอก CLI");
  const [hasGeneratedConfig, setHasGeneratedConfig] = useState(false);

  const generatedConfig = useMemo(() => buildConfig(form), [form]);
  const displayedConfig = hasGeneratedConfig ? generatedConfig : "";

  const updateField = (key: keyof BasicFortigateForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyConfig = async () => {
    if (!displayedConfig) return;
    await navigator.clipboard.writeText(displayedConfig);
    setCopyLabel("คัดลอกแล้ว ✓");
    window.setTimeout(() => setCopyLabel("คัดลอก CLI"), 1800);
  };

  const exportConfig = () => {
    if (!displayedConfig) return;
    const blob = new Blob([displayedConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "basic-fortigate-first-implementation.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.20),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(135deg,#020617,#0f172a_52%,#111827)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950/70 shadow-2xl shadow-cyan-950/20 ring-1 ring-white/10 backdrop-blur">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">FortiRule Builder</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-100">Offline Config Generator</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">ตัวช่วยตั้งค่า FortiGate สำหรับงาน First Implement</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Dashboard ภาษาไทยสำหรับ Network Engineer มือใหม่ กรอกข้อมูลตามลำดับขั้น แล้วกด Generate เพื่อสร้าง FortiGate CLI แบบปลอดภัยโดยไม่เชื่อมต่ออุปกรณ์จริง
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/60">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Security workflow</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-200">
                <span className="rounded-2xl bg-slate-950/70 px-3 py-3">Plan</span>
                <span className="rounded-2xl bg-cyan-400/15 px-3 py-3 text-cyan-100">Generate</span>
                <span className="rounded-2xl bg-slate-950/70 px-3 py-3">Review</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_minmax(380px,0.85fr)]">
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <nav className="rounded-[2rem] border border-slate-700/70 bg-slate-950/70 p-4 shadow-2xl shadow-slate-950/40 ring-1 ring-white/5 backdrop-blur">
              <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Wizard Steps</p>
              <div className="space-y-2">
                {stepNavigation.map((step) => (
                  <a key={step.id} href={`#${step.id}`} className="group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm transition hover:border-cyan-300/30 hover:bg-cyan-300/10">
                    <span>
                      <span className="block font-bold text-slate-100 group-hover:text-cyan-100">{step.label}</span>
                      <span className="text-xs text-slate-500">{step.detail}</span>
                    </span>
                    <span className="text-slate-600 group-hover:text-cyan-200">›</span>
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <div className="space-y-6">
            <ModuleCard id="wan" icon="🌐" title="1. WAN Internet Setup" description="กรอกข้อมูลขาออกอินเทอร์เน็ตจาก ISP เลือก Static IP, DHCP หรือ PPPoE ตามวงจรจริง">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="WAN interface" hint="ตัวอย่าง: wan1, port1 หรือชื่อ Interface ที่ต่อกับ ISP">
                  <input className={inputClass} value={form.wanInterface} onChange={updateField("wanInterface")} placeholder="wan1" />
                </Field>
                <Field label="ประเภทการเชื่อมต่อ" hint="เลือกตามเอกสารจากผู้ให้บริการ Internet">
                  <select className={inputClass} value={form.wanConnectionType} onChange={updateField("wanConnectionType")}>
                    <option value="static">Static IP</option>
                    <option value="dhcp">DHCP</option>
                    <option value="pppoe">PPPoE</option>
                  </select>
                </Field>
                <Field label="IP address" hint="ใช้เมื่อเป็น Static IP เช่น 203.0.113.10">
                  <input className={inputClass} value={form.wanIpAddress} onChange={updateField("wanIpAddress")} placeholder="203.0.113.10" />
                </Field>
                <Field label="Subnet mask" hint="ใช้เมื่อเป็น Static IP เช่น 255.255.255.248">
                  <input className={inputClass} value={form.wanSubnetMask} onChange={updateField("wanSubnetMask")} placeholder="255.255.255.248" />
                </Field>
                <Field label="Gateway" hint="ใช้สร้าง Default Route เมื่อเป็น Static IP">
                  <input className={inputClass} value={form.wanGateway} onChange={updateField("wanGateway")} placeholder="203.0.113.9" />
                </Field>
                <Field label="PPPoE username" hint="กรอกเมื่อ ISP ใช้ PPPoE เท่านั้น">
                  <input className={inputClass} value={form.pppoeUsername} onChange={updateField("pppoeUsername")} placeholder="username จาก ISP" />
                </Field>
                <Field label="PPPoE password" hint="ใช้สำหรับวงจร PPPoE และจะแสดงใน CLI ที่ Export">
                  <input className={inputClass} value={form.pppoePassword} onChange={updateField("pppoePassword")} placeholder="password จาก ISP" type="password" />
                </Field>
              </div>
            </ModuleCard>

            <ModuleCard id="lan" icon="🧭" title="2. LAN Setup" description="ตั้งค่า Interface ฝั่งภายในให้เป็น Gateway หลักของเครื่อง Client">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="LAN interface" hint="ตัวอย่าง: lan, port2, internal">
                  <input className={inputClass} value={form.lanInterface} onChange={updateField("lanInterface")} placeholder="lan" />
                </Field>
                <Field label="LAN IP address" hint="IP Gateway ของผู้ใช้ภายใน">
                  <input className={inputClass} value={form.lanIpAddress} onChange={updateField("lanIpAddress")} placeholder="192.168.1.1" />
                </Field>
                <Field label="Subnet mask" hint="ตัวอย่าง: 255.255.255.0">
                  <input className={inputClass} value={form.lanSubnetMask} onChange={updateField("lanSubnetMask")} placeholder="255.255.255.0" />
                </Field>
              </div>
            </ModuleCard>

            <ModuleCard id="dhcp" icon="📡" title="3. DHCP Server" description="กำหนดช่วง IP, DNS และ Gateway ที่จะแจกให้ Client ใน LAN">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="DHCP start IP" hint="IP แรกของช่วงที่จะแจกให้ Client">
                  <input className={inputClass} value={form.dhcpStartIp} onChange={updateField("dhcpStartIp")} placeholder="192.168.1.100" />
                </Field>
                <Field label="DHCP end IP" hint="IP สุดท้ายของช่วงที่จะแจกให้ Client">
                  <input className={inputClass} value={form.dhcpEndIp} onChange={updateField("dhcpEndIp")} placeholder="192.168.1.200" />
                </Field>
                <Field label="DNS primary" hint="ตัวอย่าง DNS สาธารณะ: 8.8.8.8">
                  <input className={inputClass} value={form.dnsPrimary} onChange={updateField("dnsPrimary")} placeholder="8.8.8.8" />
                </Field>
                <Field label="DNS secondary" hint="ตัวอย่าง DNS สำรอง: 1.1.1.1">
                  <input className={inputClass} value={form.dnsSecondary} onChange={updateField("dnsSecondary")} placeholder="1.1.1.1" />
                </Field>
                <Field label="Gateway" hint="ปกติใช้ IP เดียวกับ LAN interface">
                  <input className={inputClass} value={form.dhcpGateway} onChange={updateField("dhcpGateway")} placeholder="192.168.1.1" />
                </Field>
              </div>
            </ModuleCard>

            <ModuleCard id="policy" icon="🛡️" title="4. Basic Firewall Policy" description="สร้าง Policy พื้นฐาน LAN ไป Internet: Service ALL, Action ACCEPT และ NAT Enable อัตโนมัติ">
              <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-4">
                <SummaryTile label="ต้นทาง" value={form.lanInterface} />
                <SummaryTile label="ปลายทาง" value={form.wanInterface} />
                <SummaryTile label="Service / Action" value="ALL / ACCEPT" />
                <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 shadow-lg shadow-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">NAT</p>
                  <p className="mt-2 text-sm font-black text-emerald-50">Enable</p>
                </div>
              </div>
            </ModuleCard>

            <ModuleCard id="nat-dns" icon="🔁" title="5. NAT / DNS / Gateway" description="ตรวจสอบค่า NAT, DNS และ Default Gateway ก่อนสร้าง CLI เพื่อหลีกเลี่ยงปัญหาออกอินเทอร์เน็ตไม่ได้">
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryTile label="NAT Status" value="Enable สำหรับ LAN to Internet" />
                <SummaryTile label="DNS" value={`${form.dnsPrimary} / ${form.dnsSecondary}`} />
                <SummaryTile label="Default Gateway" value={form.wanConnectionType === "static" ? form.wanGateway : getWanModeLabel(form.wanConnectionType)} />
              </div>
            </ModuleCard>

            <ModuleCard id="vpn" icon="🔐" title="6. Optional SSL VPN" description="เปิดเฉพาะเมื่อไซต์นี้ต้องการให้ผู้ใช้นอกองค์กร VPN เข้ามาใช้งาน LAN">
              <label className="mb-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
                <span>
                  <span className="block font-bold text-white">Enable SSL VPN</span>
                  <span className="text-xs text-slate-400">เมื่อเปิด ระบบจะสร้าง SSL VPN CLI และ Policy เข้า LAN</span>
                </span>
                <input checked={form.enableSslVpn} className="h-6 w-6 accent-cyan-300" onChange={updateField("enableSslVpn")} type="checkbox" />
              </label>
              {form.enableSslVpn ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="VPN user group" hint="ต้องมี User Group นี้บน FortiGate หรือสร้างเพิ่มก่อนใช้งาน">
                    <input className={inputClass} value={form.vpnUserGroup} onChange={updateField("vpnUserGroup")} placeholder="SSLVPN_Users" />
                  </Field>
                  <Field label="Tunnel IP pool" hint="ชื่อ IP Pool สำหรับผู้ใช้ SSL VPN">
                    <input className={inputClass} value={form.vpnTunnelIpPool} onChange={updateField("vpnTunnelIpPool")} placeholder="SSLVPN_TUNNEL_ADDR1" />
                  </Field>
                  <Field label="Allowed LAN subnet" hint="รูปแบบ FortiGate เช่น 192.168.1.0 255.255.255.0">
                    <input className={inputClass} value={form.vpnAllowedLanSubnet} onChange={updateField("vpnAllowedLanSubnet")} placeholder="192.168.1.0 255.255.255.0" />
                  </Field>
                  <Field label="VPN portal name" hint="ชื่อ Portal ที่จะผูกกับ User Group">
                    <input className={inputClass} value={form.vpnPortalName} onChange={updateField("vpnPortalName")} placeholder="full-access" />
                  </Field>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm text-slate-400">ยังไม่เปิด SSL VPN จึงจะไม่สร้างคำสั่ง VPN ใน CLI</div>
              )}
            </ModuleCard>

            <ModuleCard id="checklist" icon="✅" title="7. Firmware และ Testing Checklist" description="Checklist สำหรับ Engineer มือใหม่ ไม่มีคำสั่ง Upgrade Firmware จริงเพื่อความปลอดภัย">
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-bold text-cyan-100">Firmware และ Backup</h3>
                  <Checklist items={firmwareChecklist} />
                </div>
                <div>
                  <h3 className="mb-3 font-bold text-cyan-100">Testing หลังติดตั้ง</h3>
                  <Checklist items={testingChecklist} />
                </div>
              </div>
            </ModuleCard>

            <ModuleCard id="export" icon="🚀" title="8. Generate และ Export Config" description="กด Generate เพื่อสร้าง CLI จากข้อมูลทั้งหมด จากนั้น Copy หรือ Export เป็นไฟล์ .txt">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setHasGeneratedConfig(true)} className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200">
                  Generate FortiGate CLI
                </button>
                <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
                  ตรวจสอบค่าอีกครั้งก่อนนำไปใช้กับอุปกรณ์จริง
                </p>
              </div>
            </ModuleCard>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[2rem] border border-slate-700/70 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/50 ring-1 ring-white/5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Summary</p>
                  <h2 className="mt-1 text-xl font-black text-white">ภาพรวม Config</h2>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{getGeneratedSectionCount(form.enableSslVpn)} sections</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <SummaryTile label="WAN interface" value={`${form.wanInterface} / ${getWanModeLabel(form.wanConnectionType)}`} />
                <SummaryTile label="LAN subnet" value={`${form.lanIpAddress} ${form.lanSubnetMask}`} />
                <SummaryTile label="DHCP range" value={`${form.dhcpStartIp} - ${form.dhcpEndIp}`} />
                <SummaryTile label="NAT status" value="Enable" />
                <SummaryTile label="VPN status" value={form.enableSslVpn ? "เปิด SSL VPN" : "ปิด SSL VPN"} />
                <SummaryTile label="Generated sections" value={`${getGeneratedSectionCount(form.enableSslVpn)} ส่วน`} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-cyan-200/20 bg-slate-950/85 p-5 shadow-2xl shadow-slate-950/60 ring-1 ring-white/5 backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Terminal Output</p>
                  <h2 className="mt-1 text-2xl font-black text-white">คอนฟิก CLI สำหรับ FortiGate</h2>
                  <p className="mt-1 text-sm text-amber-100">⚠️ ตรวจสอบค่าอีกครั้งก่อนนำไปใช้กับอุปกรณ์จริง</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copyConfig} disabled={!displayedConfig} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">
                    {copyLabel}
                  </button>
                  <button type="button" onClick={exportConfig} disabled={!displayedConfig} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
                    ส่งออก .txt
                  </button>
                </div>
              </div>
              {displayedConfig ? (
                <pre className="max-h-[70vh] overflow-auto rounded-3xl border border-slate-700/80 bg-[#020617] p-5 text-sm leading-6 text-cyan-50 shadow-inner shadow-black/60">
                  <code>{displayedConfig}</code>
                </pre>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-[#020617] p-8 text-center shadow-inner shadow-black/60">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-2xl">⌁</div>
                    <p className="text-lg font-bold text-slate-100">กรอกข้อมูลด้านซ้าย แล้วกด Generate เพื่อสร้าง FortiGate CLI</p>
                    <p className="mt-2 text-sm text-slate-500">CLI จะปรากฏใน Terminal Output พร้อมปุ่ม Copy และ Export .txt</p>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
