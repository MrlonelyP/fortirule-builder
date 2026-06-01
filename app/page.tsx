"use client";

import { ChangeEvent, useMemo, useState } from "react";

type WanConnectionType = "static" | "dhcp" | "pppoe";
type FortiOsVersion = "7.0" | "7.2" | "7.4" | "7.6";
type FortiGateModel = "40F" | "60F" | "70F" | "70G" | "80F" | "90G" | "100F" | "100G" | "200F" | "400F" | "Custom";
type Service = "ALL" | "HTTP" | "HTTPS" | "DNS" | "RDP" | "PING";
type Action = "ACCEPT" | "DENY";
type NatMode = "AUTO" | "ENABLE" | "DISABLE";

type ProjectProfile = {
  projectName: string;
  engineerName: string;
  projectDate: string;
};

type BasicFortigateForm = {
  fortigateModel: FortiGateModel;
  fortiOsVersion: FortiOsVersion;
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

type Vlan = {
  uid: string;
  name: string;
  vlanId: string;
  interfaceName: string;
  gatewayIp: string;
  subnetMask: string;
  dhcpStartIp: string;
  dhcpEndIp: string;
  allowInternet: boolean;
};

type PolicyRule = {
  uid: string;
  name: string;
  sourceVlanUid: string;
  destination: string;
  service: Service;
  action: Action;
  nat: NatMode;
};

type VlanDraft = Omit<Vlan, "uid">;
type PolicyDraft = Omit<PolicyRule, "uid">;

const inputClass =
  "w-full rounded-xl border border-sky-900/80 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-sky-200/80";
const cardClass = "rounded-2xl border border-sky-900/70 bg-[#0b1730]/90 shadow-xl shadow-slate-950/30 ring-1 ring-cyan-300/5";

const internetDestination = "internet";
const fortigateModels: FortiGateModel[] = ["40F", "60F", "70F", "70G", "80F", "90G", "100F", "100G", "200F", "400F", "Custom"];
const fortiOsVersions: FortiOsVersion[] = ["7.0", "7.2", "7.4", "7.6"];
const firewallServices: Service[] = ["ALL", "HTTP", "HTTPS", "DNS", "RDP", "PING"];

const defaultProject: ProjectProfile = {
  projectName: "ABC Company - Head Office",
  engineerName: "Network Engineer",
  projectDate: new Date().toISOString().slice(0, 10),
};

const defaultForm: BasicFortigateForm = {
  fortigateModel: "60F",
  fortiOsVersion: "7.4",
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

const defaultVlans: Vlan[] = [
  { uid: "vlan-10", name: "Server", vlanId: "10", interfaceName: "port3", gatewayIp: "192.168.10.1", subnetMask: "255.255.255.0", dhcpStartIp: "192.168.10.100", dhcpEndIp: "192.168.10.200", allowInternet: true },
  { uid: "vlan-20", name: "Client", vlanId: "20", interfaceName: "port4", gatewayIp: "192.168.20.1", subnetMask: "255.255.255.0", dhcpStartIp: "192.168.20.100", dhcpEndIp: "192.168.20.220", allowInternet: true },
  { uid: "vlan-30", name: "WiFi", vlanId: "30", interfaceName: "port5", gatewayIp: "192.168.30.1", subnetMask: "255.255.255.0", dhcpStartIp: "192.168.30.50", dhcpEndIp: "192.168.30.220", allowInternet: true },
  { uid: "vlan-40", name: "CCTV", vlanId: "40", interfaceName: "port6", gatewayIp: "192.168.40.1", subnetMask: "255.255.255.0", dhcpStartIp: "192.168.40.50", dhcpEndIp: "192.168.40.180", allowInternet: false },
];

const defaultVlanDraft: VlanDraft = {
  name: "Guest",
  vlanId: "50",
  interfaceName: "port7",
  gatewayIp: "192.168.50.1",
  subnetMask: "255.255.255.0",
  dhcpStartIp: "192.168.50.100",
  dhcpEndIp: "192.168.50.200",
  allowInternet: true,
};

const defaultPolicies: PolicyRule[] = [
  { uid: "policy-client-internet", name: "Client_to_Internet", sourceVlanUid: "vlan-20", destination: internetDestination, service: "ALL", action: "ACCEPT", nat: "AUTO" },
  { uid: "policy-cctv-server", name: "CCTV_to_Server", sourceVlanUid: "vlan-40", destination: "vlan-10", service: "HTTPS", action: "DENY", nat: "DISABLE" },
];

const defaultPolicyDraft: PolicyDraft = {
  name: "New_Policy",
  sourceVlanUid: "vlan-20",
  destination: internetDestination,
  service: "ALL",
  action: "ACCEPT",
  nat: "AUTO",
};

const firmwareChecklist = [
  "Firmware Check",
  "WAN Configuration",
  "LAN / VLAN Configuration",
  "DHCP Configuration",
  "Firewall Policy",
  "NAT Configuration",
  "VPN Configuration",
  "Backup Configuration",
];

const sidebarSections = [
  { title: "Menu", items: ["Dashboard", "WAN", "LAN / VLAN", "DHCP", "Firewall Policy", "NAT", "VPN", "Routing", "System"] },
  { title: "Tools", items: ["IP Calculator", "Network Diagram", "Templates"] },
  { title: "Deployment", items: ["Checklist", "Backup / Restore"] },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span> : null}
    </label>
  );
}

function MetricCard({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "green" | "red" | "blue" }) {
  const toneClass = {
    cyan: "border-cyan-400/30 text-cyan-100",
    green: "border-emerald-400/30 text-emerald-100",
    red: "border-red-400/30 text-red-100",
    blue: "border-blue-400/30 text-blue-100",
  }[tone];

  return (
    <div className={`rounded-2xl border bg-slate-950/45 p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}

function getSyntaxProfile(version: FortiOsVersion) {
  const sharedProfile = {
    coreSyntax: "Basic WAN/LAN/DHCP/Firewall Policy/NAT syntax compatible",
    syntaxModules: {
      basic: "compatible",
      vpn: "reserved-for-version-specific-rules",
      sdWan: "reserved-for-version-specific-rules",
      securityProfile: "reserved-for-version-specific-rules",
    },
  };

  const versionNotes: Record<FortiOsVersion, string[]> = {
    "7.0": ["Baseline profile สำหรับ First Implement", "เตรียมแยก VPN / SD-WAN syntax ในอนาคต"],
    "7.2": ["Basic WAN/LAN/DHCP/Policy/NAT ใช้ syntax ชุดเดียวกับ template นี้", "ตรวจสอบ build จริงก่อนใช้ feature ขั้นสูง"],
    "7.4": ["Profile แนะนำสำหรับ template ปัจจุบัน", "รองรับโครงสร้างแยก Security Profile syntax ภายหลัง"],
    "7.6": ["เตรียมไว้สำหรับ syntax รุ่นใหม่", "ตรวจสอบ release notes และ build จริงก่อนใช้งานจริง"],
  };

  return { version, ...sharedProfile, notes: versionNotes[version] };
}

function makeUid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVlanName(vlan?: Vlan) {
  if (!vlan) return "ไม่พบ VLAN";
  return `VLAN${vlan.vlanId} ${vlan.name}`;
}

function getDestinationName(destination: string, vlans: Vlan[]) {
  if (destination === internetDestination) return "Internet";
  return getVlanName(vlans.find((vlan) => vlan.uid === destination));
}

function getEffectiveNat(policy: PolicyRule | PolicyDraft) {
  if (policy.nat === "ENABLE") return "enable";
  if (policy.nat === "DISABLE") return "disable";
  return policy.destination === internetDestination ? "enable" : "disable";
}

function getNatLabel(policy: PolicyRule | PolicyDraft) {
  if (policy.nat === "AUTO") return getEffectiveNat(policy) === "enable" ? "Auto → Enable" : "Auto → Disable";
  return policy.nat === "ENABLE" ? "Enable" : "Disable";
}

function cidrFromMask(mask: string) {
  const bits = mask
    .split(".")
    .map((part) => Number(part).toString(2).padStart(8, "0"))
    .join("")
    .split("1").length - 1;
  return Number.isFinite(bits) ? bits : 24;
}

function buildWanCli(form: BasicFortigateForm) {
  const lines = ["config system interface", `    edit \"${form.wanInterface}\"`, "        set role wan", "        set allowaccess ping"];
  if (form.wanConnectionType === "dhcp") lines.push("        set mode dhcp");
  if (form.wanConnectionType === "pppoe") lines.push("        set mode pppoe", `        set username \"${form.pppoeUsername}\"`, `        set password \"${form.pppoePassword}\"`);
  if (form.wanConnectionType === "static") lines.push("        set mode static", `        set ip ${form.wanIpAddress} ${form.wanSubnetMask}`);
  lines.push("    next", "end");
  return lines.join("\n");
}

function buildVlanAndDhcpCli(vlans: Vlan[], dnsPrimary: string, dnsSecondary: string) {
  return vlans
    .map((vlan, index) => `# VLAN ${index + 1}: ${getVlanName(vlan)}\n# คำอธิบาย: สร้าง VLAN ${vlan.vlanId} บน ${vlan.interfaceName} พร้อม DHCP ${vlan.dhcpStartIp}-${vlan.dhcpEndIp}\nconfig system interface\n    edit \"${getVlanName(vlan)}\"\n        set role lan\n        set interface \"${vlan.interfaceName}\"\n        set vlanid ${vlan.vlanId}\n        set ip ${vlan.gatewayIp} ${vlan.subnetMask}\n        set allowaccess ping https ssh\n    next\nend\n\nconfig system dhcp server\n    edit 0\n        set interface \"${getVlanName(vlan)}\"\n        set default-gateway ${vlan.gatewayIp}\n        set netmask ${vlan.subnetMask}\n        set dns-service specify\n        set dns-server1 ${dnsPrimary}\n        set dns-server2 ${dnsSecondary}\n        config ip-range\n            edit 1\n                set start-ip ${vlan.dhcpStartIp}\n                set end-ip ${vlan.dhcpEndIp}\n            next\n        end\n    next\nend`)
    .join("\n\n");
}

function buildPolicyCli(policies: PolicyRule[], vlans: Vlan[], wanInterface: string) {
  return policies
    .map((policy, index) => {
      const source = vlans.find((vlan) => vlan.uid === policy.sourceVlanUid);
      const destination = vlans.find((vlan) => vlan.uid === policy.destination);
      const destinationInterface = policy.destination === internetDestination ? wanInterface : getVlanName(destination);
      const actionText = policy.action === "ACCEPT" ? "อนุญาต" : "ปฏิเสธ";
      const natText = getEffectiveNat(policy) === "enable" ? "เปิด NAT" : "ปิด NAT";
      return `# Policy ${index + 1}: ${policy.name}\n# คำอธิบาย: ${actionText} จาก ${getVlanName(source)} ไปยัง ${getDestinationName(policy.destination, vlans)} service ${policy.service} และ ${natText}\nconfig firewall policy\n    edit 0\n        set name \"${policy.name}\"\n        set srcintf \"${getVlanName(source)}\"\n        set dstintf \"${destinationInterface}\"\n        set srcaddr \"all\"\n        set dstaddr \"all\"\n        set action ${policy.action.toLowerCase()}\n        set schedule \"always\"\n        set service \"${policy.service}\"\n        set logtraffic all\n        set nat ${getEffectiveNat(policy)}\n    next\nend`;
    })
    .join("\n\n");
}

function buildDefaultRouteCli(form: BasicFortigateForm) {
  if (form.wanConnectionType !== "static") return `# WAN mode ${form.wanConnectionType}: default route is normally received from ISP`;
  return `config router static\n    edit 1\n        set gateway ${form.wanGateway}\n        set device \"${form.wanInterface}\"\n    next\nend`;
}

function buildVpnCli(form: BasicFortigateForm) {
  if (!form.enableSslVpn) return "# SSL VPN disabled";
  return `# Optional SSL VPN template\nconfig vpn ssl web portal\n    edit \"${form.vpnPortalName}\"\n        set tunnel-mode enable\n        set split-tunneling enable\n        set ip-pools \"${form.vpnTunnelIpPool}\"\n    next\nend\n\nconfig vpn ssl settings\n    set source-interface \"${form.wanInterface}\"\n    set source-address \"all\"\n    set default-portal \"${form.vpnPortalName}\"\n    config authentication-rule\n        edit 1\n            set groups \"${form.vpnUserGroup}\"\n            set portal \"${form.vpnPortalName}\"\n        next\n    end\nend`;
}

function buildConfig(project: ProjectProfile, form: BasicFortigateForm, vlans: Vlan[], policies: PolicyRule[]) {
  const syntaxProfile = getSyntaxProfile(form.fortiOsVersion);

  return `# FortiRule Builder - Professional Deployment CLI\n# Project: ${project.projectName}\n# Engineer: ${project.engineerName}\n# Date: ${project.projectDate}\n# FortiGate Model: ${form.fortigateModel}\n# FortiOS Version: ${form.fortiOsVersion}\n# Syntax Profile: ${syntaxProfile.coreSyntax}\n# Version Notes: ${syntaxProfile.notes.join(" | ")}\n# ตรวจสอบ Syntax กับ FortiOS build จริงก่อนนำไปใช้กับอุปกรณ์จริง\n# Frontend only: ไม่มีการเชื่อมต่อ FortiGate จริง\n\n# === WAN ===\n${buildWanCli(form)}\n\n# === LAN / VLAN + DHCP ===\n${buildVlanAndDhcpCli(vlans, form.dnsPrimary, form.dnsSecondary)}\n\n# === DNS / Routing ===\nconfig system dns\n    set primary ${form.dnsPrimary}\n    set secondary ${form.dnsSecondary}\nend\n\n${buildDefaultRouteCli(form)}\n\n# === Firewall Policy / NAT ===\n${buildPolicyCli(policies, vlans, form.wanInterface)}\n\n# === VPN ===\n${buildVpnCli(form)}\n\n# === Deployment Checklist ===\n${firmwareChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}`;
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderCliLine(line: string, index: number) {
  const isComment = line.trim().startsWith("#");
  return (
    <div key={`${line}-${index}`} className={isComment ? "text-emerald-300" : "text-cyan-50"}>
      {line || "\u00A0"}
    </div>
  );
}

export default function Home() {
  const [project, setProject] = useState<ProjectProfile>(defaultProject);
  const [form, setForm] = useState<BasicFortigateForm>(defaultForm);
  const [vlans, setVlans] = useState<Vlan[]>(defaultVlans);
  const [vlanDraft, setVlanDraft] = useState<VlanDraft>(defaultVlanDraft);
  const [policies, setPolicies] = useState<PolicyRule[]>(defaultPolicies);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(defaultPolicyDraft);
  const [copyLabel, setCopyLabel] = useState("Copy CLI");
  const [viewMode, setViewMode] = useState("Topology");

  const generatedConfig = useMemo(() => buildConfig(project, form, vlans, policies), [project, form, vlans, policies]);
  const haStatus = "Standalone";
  const totalNat = policies.filter((policy) => getEffectiveNat(policy) === "enable").length;
  const completedItems = [true, true, vlans.length > 0, true, policies.length > 0, totalNat > 0, form.enableSslVpn, true].filter(Boolean).length;
  const progress = Math.round((completedItems / firmwareChecklist.length) * 100);

  const updateProject = (key: keyof ProjectProfile) => (event: ChangeEvent<HTMLInputElement>) => setProject((current) => ({ ...current, [key]: event.target.value }));
  const updateField = (key: keyof BasicFortigateForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };
  const updateVlanDraft = (key: keyof VlanDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setVlanDraft((current) => ({ ...current, [key]: key === "allowInternet" ? value === "yes" : value }));
  };
  const updatePolicyDraft = (key: keyof PolicyDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPolicyDraft((current) => ({ ...current, [key]: event.target.value }));
  };

  const addVlan = () => {
    const newVlan = { ...vlanDraft, uid: makeUid("vlan") };
    setVlans((current) => [...current, newVlan]);
    const nextId = Number(vlanDraft.vlanId || 50) + 10;
    setVlanDraft({ ...defaultVlanDraft, vlanId: String(nextId), name: `VLAN${nextId}`, gatewayIp: `192.168.${nextId}.1`, dhcpStartIp: `192.168.${nextId}.100`, dhcpEndIp: `192.168.${nextId}.200` });
  };

  const addPolicy = () => {
    if (!policyDraft.sourceVlanUid) return;
    setPolicies((current) => [...current, { ...policyDraft, uid: makeUid("policy") }]);
    setPolicyDraft((current) => ({ ...current, name: "New_Policy" }));
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopyLabel("Copied ✓");
    window.setTimeout(() => setCopyLabel("Copy CLI"), 1500);
  };

  const saveProject = () => downloadText("fortirule-project.json", JSON.stringify({ project, form, vlans, policies }, null, 2), "application/json;charset=utf-8");
  const exportTxt = () => downloadText("fortirule-config.txt", generatedConfig);
  const exportPdf = () => downloadText("fortirule-config.pdf", generatedConfig, "application/pdf");
  const exportReport = () => downloadText("implementation-report.txt", `Implementation Report\n\n${generatedConfig}`);

  return (
    <main className="min-h-screen bg-[#061122] text-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sky-900/70 bg-[#07162c]/95 p-5 shadow-2xl shadow-slate-950/50 lg:block">
        <div className="mb-8 rounded-2xl border border-cyan-300/20 bg-sky-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 font-black text-slate-950">FR</div>
            <div>
              <h1 className="font-black text-white">FortiRule Builder</h1>
              <p className="text-xs text-sky-200">First Implementation Assistant</p>
            </div>
          </div>
        </div>
        <div className="space-y-6 overflow-y-auto pb-8">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-xs font-black uppercase tracking-[0.25em] text-sky-500">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <a key={item} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-cyan-300/10 hover:text-cyan-100" href="#dashboard">
                    {item}<span className="text-slate-600">›</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="dashboard" className="lg:pl-72">
        <div className="mx-auto max-w-[1720px] space-y-4 p-4 xl:p-6">
          <section className={`${cardClass} p-4`}>
            <div className="grid gap-3 xl:grid-cols-[1fr_220px_180px_auto] xl:items-end">
              <Field label="Project Name">
                <input className={inputClass} value={project.projectName} onChange={updateProject("projectName")} />
              </Field>
              <Field label="Engineer">
                <input className={inputClass} value={project.engineerName} onChange={updateProject("engineerName")} />
              </Field>
              <Field label="Date">
                <input className={inputClass} type="date" value={project.projectDate} onChange={updateProject("projectDate")} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button onClick={saveProject} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-white hover:bg-sky-400" type="button">Save Project</button>
                <button className="rounded-xl border border-sky-700 px-3 py-2 text-sm font-bold text-sky-100 hover:bg-sky-900/60" type="button">Load Project</button>
                <button onClick={exportTxt} className="rounded-xl border border-cyan-500/40 px-3 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/10" type="button">Export</button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className={`${cardClass} p-4`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Device Profile</p>
                  <h2 className="text-xl font-black text-white">FortiGate Model / FortiOS Version</h2>
                </div>
                <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-100">ตรวจสอบ Syntax กับ FortiOS build จริงก่อนนำไปใช้กับอุปกรณ์จริง</div>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <Field label="FortiGate Model">
                  <select className={inputClass} value={form.fortigateModel} onChange={updateField("fortigateModel")}>
                    {fortigateModels.map((model) => <option key={model} value={model}>{model}</option>)}
                  </select>
                </Field>
                <Field label="FortiOS Version">
                  <select className={inputClass} value={form.fortiOsVersion} onChange={updateField("fortiOsVersion")}>
                    {fortiOsVersions.map((version) => <option key={version} value={version}>{version}</option>)}
                  </select>
                </Field>
                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-3 text-sm text-sky-100">
                  <p className="font-bold">{getSyntaxProfile(form.fortiOsVersion).coreSyntax}</p>
                  <p className="mt-1 text-xs text-sky-200/80">{getSyntaxProfile(form.fortiOsVersion).notes.join(" • ")}</p>
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-4`}>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <MetricCard label="Model" value={form.fortigateModel} />
                <MetricCard label="FortiOS" value={form.fortiOsVersion} />
                <MetricCard label="Total VLAN" value={String(vlans.length)} tone="blue" />
                <MetricCard label="Total Policy" value={String(policies.length)} tone="blue" />
                <MetricCard label="Total NAT" value={String(totalNat)} tone="green" />
                <MetricCard label="VPN Status" value={form.enableSslVpn ? "Enabled" : "Disabled"} tone={form.enableSslVpn ? "green" : "red"} />
                <MetricCard label="HA Status" value={haStatus} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(440px,0.7fr)]">
            <div className={`${cardClass} p-5`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Network Topology</p>
                  <h2 className="text-xl font-black text-white">Internet → WAN1 → FortiGate → VLANs</h2>
                </div>
                <div className="flex gap-2">
                  {['Topology', 'Logical', 'Physical'].map((mode) => (
                    <button key={mode} onClick={() => setViewMode(mode)} className={`rounded-xl px-3 py-2 text-xs font-bold ${viewMode === mode ? 'bg-cyan-300 text-slate-950' : 'border border-sky-800 text-sky-100'}`} type="button">{mode}</button>
                  ))}
                  <button onClick={addVlan} className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white" type="button">+ Add Device</button>
                </div>
              </div>
              <div className="rounded-3xl border border-sky-900/80 bg-[#081326] p-6">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
                  <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-6 py-3 text-center shadow-lg shadow-cyan-950/30">🌐<div className="text-sm font-bold text-cyan-100">Internet</div></div>
                  <div className="h-8 w-px bg-cyan-400/50" />
                  <div className="rounded-2xl border border-sky-400/40 bg-sky-400/10 px-6 py-3 text-center"><p className="text-sm font-black text-sky-100">WAN1</p><p className="text-xs text-slate-400">{form.wanIpAddress}</p></div>
                  <div className="h-8 w-px bg-cyan-400/50" />
                  <div className="rounded-[2rem] border border-cyan-300/40 bg-gradient-to-br from-sky-500/30 to-cyan-300/10 px-10 py-6 text-center shadow-2xl shadow-cyan-950/40">
                    <p className="text-3xl">🛡️</p><p className="text-lg font-black text-white">FortiGate {form.fortigateModel}</p><p className="text-xs text-cyan-100">FortiOS {form.fortiOsVersion} • {haStatus}</p>
                  </div>
                  <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {vlans.map((vlan) => (
                      <div key={vlan.uid} className="rounded-2xl border border-sky-700/70 bg-slate-950/60 p-4 text-center">
                        <p className="font-black text-cyan-100">VLAN{vlan.vlanId} {vlan.name}</p>
                        <p className="text-sm text-slate-300">{vlan.gatewayIp}/{cidrFromMask(vlan.subnetMask)}</p>
                        <p className="text-xs text-slate-500">{vlan.interfaceName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${cardClass} p-5`}>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">Deployment Checklist</h2><span className="text-2xl font-black text-cyan-200">{progress}%</span></div>
              <div className="mb-4 h-3 rounded-full bg-slate-950"><div className="h-3 rounded-full bg-gradient-to-r from-sky-500 to-cyan-300" style={{ width: `${progress}%` }} /></div>
              <div className="space-y-2">
                {firmwareChecklist.map((item, index) => {
                  const done = index < completedItems;
                  return <div key={item} className="flex items-center gap-3 rounded-xl border border-sky-900/70 bg-slate-950/45 p-3 text-sm"><span className={`h-3 w-3 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-600'}`} />{item}</div>;
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className={`${cardClass} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-sky-900/70 p-4"><h2 className="font-black text-white">VLAN Configuration</h2><button onClick={addVlan} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950" type="button">+ Add VLAN</button></div>
              <div className="grid gap-3 p-4 md:grid-cols-3">
                <Field label="ID"><input className={inputClass} value={vlanDraft.vlanId} onChange={updateVlanDraft("vlanId")} /></Field>
                <Field label="Name"><input className={inputClass} value={vlanDraft.name} onChange={updateVlanDraft("name")} /></Field>
                <Field label="Interface"><input className={inputClass} value={vlanDraft.interfaceName} onChange={updateVlanDraft("interfaceName")} /></Field>
                <Field label="Gateway"><input className={inputClass} value={vlanDraft.gatewayIp} onChange={updateVlanDraft("gatewayIp")} /></Field>
                <Field label="Subnet"><input className={inputClass} value={vlanDraft.subnetMask} onChange={updateVlanDraft("subnetMask")} /></Field>
                <Field label="Internet"><select className={inputClass} value={vlanDraft.allowInternet ? "yes" : "no"} onChange={updateVlanDraft("allowInternet")}><option value="yes">Allow</option><option value="no">Block</option></select></Field>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-950/70 text-slate-400"><tr><th className="px-4 py-3">ID</th><th>Name</th><th>Interface</th><th>Gateway</th><th>Subnet</th><th>Action</th></tr></thead><tbody className="divide-y divide-sky-950/70">{vlans.map((vlan) => <tr key={vlan.uid}><td className="px-4 py-3 font-bold text-cyan-100">{vlan.vlanId}</td><td>{vlan.name}</td><td>{vlan.interfaceName}</td><td>{vlan.gatewayIp}</td><td>{vlan.subnetMask}</td><td><button onClick={() => setVlans((current) => current.filter((item) => item.uid !== vlan.uid))} className="text-red-300" type="button">Delete</button></td></tr>)}</tbody></table></div>
            </div>

            <div className={`${cardClass} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-sky-900/70 p-4"><h2 className="font-black text-white">Policy Matrix</h2><button onClick={addPolicy} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950" type="button">+ Add Policy</button></div>
              <div className="grid gap-3 p-4 md:grid-cols-3">
                <Field label="Source"><select className={inputClass} value={policyDraft.sourceVlanUid} onChange={updatePolicyDraft("sourceVlanUid")}>{vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}</select></Field>
                <Field label="Destination"><select className={inputClass} value={policyDraft.destination} onChange={updatePolicyDraft("destination")}><option value={internetDestination}>Internet</option>{vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}</select></Field>
                <Field label="Service"><select className={inputClass} value={policyDraft.service} onChange={updatePolicyDraft("service")}>{firewallServices.map((service) => <option key={service}>{service}</option>)}</select></Field>
                <Field label="Action"><select className={inputClass} value={policyDraft.action} onChange={updatePolicyDraft("action")}><option value="ACCEPT">ALLOW</option><option value="DENY">DENY</option></select></Field>
                <Field label="NAT"><select className={inputClass} value={policyDraft.nat} onChange={updatePolicyDraft("nat")}><option value="AUTO">AUTO</option><option value="ENABLE">Enable</option><option value="DISABLE">Disable</option></select></Field>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-950/70 text-slate-400"><tr><th className="px-4 py-3">ID</th><th>Source</th><th>Destination</th><th>Service</th><th>Action</th><th>NAT</th><th>Status</th></tr></thead><tbody className="divide-y divide-sky-950/70">{policies.map((policy, index) => <tr key={policy.uid}><td className="px-4 py-3">{index + 1}</td><td>{getVlanName(vlans.find((vlan) => vlan.uid === policy.sourceVlanUid))}</td><td>{getDestinationName(policy.destination, vlans)}</td><td>{policy.service}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${policy.action === 'ACCEPT' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>{policy.action === 'ACCEPT' ? 'ALLOW' : 'DENY'}</span></td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${getEffectiveNat(policy) === 'enable' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>{getNatLabel(policy)}</span></td><td><span className="text-emerald-300">Ready</span></td></tr>)}</tbody></table></div>
            </div>
          </section>

          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-900/70 p-4">
              <div><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Generated CLI</p><h2 className="text-xl font-black text-white">FortiGate Configuration Terminal</h2></div>
              <div className="flex flex-wrap gap-2"><button onClick={copyConfig} className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950" type="button">{copyLabel}</button><button onClick={exportTxt} className="rounded-xl border border-sky-700 px-3 py-2 text-sm font-bold" type="button">Download TXT</button><button onClick={exportPdf} className="rounded-xl border border-sky-700 px-3 py-2 text-sm font-bold" type="button">Download PDF</button><button onClick={exportReport} className="rounded-xl border border-sky-700 px-3 py-2 text-sm font-bold" type="button">Implementation Report</button></div>
            </div>
            <pre className="max-h-[560px] overflow-auto bg-[#020817] p-5 font-mono text-sm leading-6">{generatedConfig.split("\n").map(renderCliLine)}</pre>
          </section>
        </div>
      </div>
    </main>
  );
}
