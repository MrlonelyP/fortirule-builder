"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

type WanConnectionType = "static" | "dhcp" | "pppoe";
type FortiOsVersion = "7.0" | "7.2" | "7.4" | "7.6";
type FortiGateModel = "40F" | "60F" | "70F" | "70G" | "80F" | "90G" | "100F" | "100G" | "200F" | "400F" | "Custom";
type Service = "ALL" | "HTTP" | "HTTPS" | "DNS" | "RDP" | "PING";
type Action = "ACCEPT" | "DENY";
type NatMode = "AUTO" | "ENABLE" | "DISABLE";
type AddressMode = "ALL" | "VLAN_SUBNET" | "CUSTOM";
type BlockApp = "TikTok" | "Facebook" | "YouTube" | "BitTorrent" | "Telegram" | "LINE" | "Instagram";
type ZoneStatus = "Ready" | "Need Config" | "Warning" | "Disabled";
type SelectedZone = "wan" | "vlan-10" | "vlan-20" | "vlan-30" | "vlan-40" | "vpn" | "nat" | "policy" | "backup";

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
  sourceAddressMode: AddressMode;
  sourceAddressName: string;
  sourceSubnet: string;
  destinationAddressMode: AddressMode;
  destinationAddressName: string;
  destinationSubnet: string;
  userGroup: string;
  schedule: string;
  logTraffic: boolean;
};

type VlanDraft = Omit<Vlan, "uid">;
type PolicyDraft = Omit<PolicyRule, "uid">;

type BlockingConfig = {
  enableAdultWebBlock: boolean;
  enableAppControl: boolean;
  webFilterProfileName: string;
  appControlProfileName: string;
  blockedApps: BlockApp[];
};

const inputClass =
  "w-full rounded-xl border border-cyan-400/20 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-1 block text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200/80";
const panelClass = "rounded-[1.75rem] border border-cyan-300/20 bg-slate-950/65 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl";
const buildingBaseClass =
  "group relative min-h-32 overflow-hidden rounded-[1.6rem] border border-cyan-300/25 bg-slate-950/75 p-4 text-left shadow-2xl shadow-cyan-950/40 transition hover:-translate-y-1 hover:border-cyan-200/70 hover:shadow-cyan-500/20";

const internetDestination = "internet";
const fortigateModels: FortiGateModel[] = ["40F", "60F", "70F", "70G", "80F", "90G", "100F", "100G", "200F", "400F", "Custom"];
const fortiOsVersions: FortiOsVersion[] = ["7.0", "7.2", "7.4", "7.6"];
const firewallServices: Service[] = ["ALL", "HTTP", "HTTPS", "DNS", "RDP", "PING"];
const addressModes: AddressMode[] = ["ALL", "VLAN_SUBNET", "CUSTOM"];
const blockableApps: BlockApp[] = ["TikTok", "Facebook", "YouTube", "BitTorrent", "Telegram", "LINE", "Instagram"];

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
  { uid: "policy-client-internet", name: "Client_to_Internet", sourceVlanUid: "vlan-20", destination: internetDestination, service: "ALL", action: "ACCEPT", nat: "AUTO", sourceAddressMode: "VLAN_SUBNET", sourceAddressName: "ADDR_Client_Subnet", sourceSubnet: "192.168.20.0 255.255.255.0", destinationAddressMode: "ALL", destinationAddressName: "all", destinationSubnet: "0.0.0.0 0.0.0.0", userGroup: "", schedule: "always", logTraffic: true },
  { uid: "policy-cctv-server", name: "CCTV_to_Server", sourceVlanUid: "vlan-40", destination: "vlan-10", service: "HTTPS", action: "DENY", nat: "DISABLE", sourceAddressMode: "VLAN_SUBNET", sourceAddressName: "ADDR_CCTV_Subnet", sourceSubnet: "192.168.40.0 255.255.255.0", destinationAddressMode: "VLAN_SUBNET", destinationAddressName: "ADDR_Server_Subnet", destinationSubnet: "192.168.10.0 255.255.255.0", userGroup: "SOC_Operators", schedule: "always", logTraffic: true },
];

const defaultPolicyDraft: PolicyDraft = {
  name: "New_Policy",
  sourceVlanUid: "vlan-20",
  destination: internetDestination,
  service: "ALL",
  action: "ACCEPT",
  nat: "AUTO",
  sourceAddressMode: "VLAN_SUBNET",
  sourceAddressName: "ADDR_Source_Subnet",
  sourceSubnet: "192.168.20.0 255.255.255.0",
  destinationAddressMode: "ALL",
  destinationAddressName: "all",
  destinationSubnet: "0.0.0.0 0.0.0.0",
  userGroup: "",
  schedule: "always",
  logTraffic: true,
};

const defaultBlockingConfig: BlockingConfig = {
  enableAdultWebBlock: true,
  enableAppControl: true,
  webFilterProfileName: "WF_Block_18Plus",
  appControlProfileName: "APP_Block_Selected",
  blockedApps: ["TikTok", "Facebook", "BitTorrent"],
};

const deploymentChecklist = [
  "Firmware Check",
  "WAN Configuration",
  "LAN / VLAN Configuration",
  "DHCP Configuration",
  "Firewall Policy",
  "NAT Configuration",
  "VPN Configuration",
  "Backup Configuration",
];

const sidebarItems = ["City Map", "Zones", "Policies", "VPN", "Export", "Settings"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span> : null}
    </label>
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


function getZoneStatus(zone: SelectedZone, form: BasicFortigateForm, vlans: Vlan[], policies: PolicyRule[]): ZoneStatus {
  if (zone === "vpn") return form.enableSslVpn ? "Ready" : "Disabled";
  if (zone === "policy") return policies.length > 0 ? "Ready" : "Need Config";
  if (zone === "nat") return policies.some((policy) => getEffectiveNat(policy) === "enable") ? "Ready" : "Warning";
  if (zone === "backup") return "Warning";
  if (zone === "wan") return form.wanInterface && (form.wanConnectionType !== "static" || form.wanGateway) ? "Ready" : "Need Config";
  return vlans.some((vlan) => vlan.uid === zone) ? "Ready" : "Need Config";
}

function statusClass(status: ZoneStatus) {
  return {
    Ready: "border-emerald-300/40 bg-emerald-400/10 text-emerald-200",
    "Need Config": "border-amber-300/50 bg-amber-400/10 text-amber-200",
    Warning: "border-orange-300/50 bg-orange-400/10 text-orange-200",
    Disabled: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  }[status];
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
    .map(
      (vlan, index) => `# VLAN ${index + 1}: ${getVlanName(vlan)}
# คำอธิบาย: สร้าง VLAN ${vlan.vlanId} บน ${vlan.interfaceName} พร้อม DHCP ${vlan.dhcpStartIp}-${vlan.dhcpEndIp}
config system interface
    edit \"${getVlanName(vlan)}\"
        set role lan
        set interface \"${vlan.interfaceName}\"
        set vlanid ${vlan.vlanId}
        set ip ${vlan.gatewayIp} ${vlan.subnetMask}
        set allowaccess ping https ssh
    next
end

config system dhcp server
    edit 0
        set interface \"${getVlanName(vlan)}\"
        set default-gateway ${vlan.gatewayIp}
        set netmask ${vlan.subnetMask}
        set dns-service specify
        set dns-server1 ${dnsPrimary}
        set dns-server2 ${dnsSecondary}
        config ip-range
            edit 1
                set start-ip ${vlan.dhcpStartIp}
                set end-ip ${vlan.dhcpEndIp}
            next
        end
    next
end`,
    )
    .join("\n\n");
}

function getPolicyAddressName(policy: PolicyRule | PolicyDraft, side: "source" | "destination", vlans: Vlan[]) {
  const mode = side === "source" ? policy.sourceAddressMode : policy.destinationAddressMode;
  if (mode === "ALL") return "all";
  if (mode === "CUSTOM") return side === "source" ? policy.sourceAddressName : policy.destinationAddressName;
  if (side === "source") {
    const source = vlans.find((vlan) => vlan.uid === policy.sourceVlanUid);
    return source ? `ADDR_VLAN${source.vlanId}_${source.name}` : policy.sourceAddressName;
  }
  if (policy.destination === internetDestination) return "all";
  const destination = vlans.find((vlan) => vlan.uid === policy.destination);
  return destination ? `ADDR_VLAN${destination.vlanId}_${destination.name}` : policy.destinationAddressName;
}

function getPolicySubnet(policy: PolicyRule | PolicyDraft, side: "source" | "destination", vlans: Vlan[]) {
  const mode = side === "source" ? policy.sourceAddressMode : policy.destinationAddressMode;
  if (mode === "CUSTOM") return side === "source" ? policy.sourceSubnet : policy.destinationSubnet;
  if (mode === "VLAN_SUBNET") {
    const vlan = side === "source" ? vlans.find((item) => item.uid === policy.sourceVlanUid) : vlans.find((item) => item.uid === policy.destination);
    if (vlan) return `${vlan.gatewayIp.replace(/\.\d+$/, ".0")} ${vlan.subnetMask}`;
  }
  return "";
}

function buildAddressAndUserCli(policies: PolicyRule[], vlans: Vlan[]) {
  const addressLines = policies.flatMap((policy) => (["source", "destination"] as const).map((side) => {
    const mode = side === "source" ? policy.sourceAddressMode : policy.destinationAddressMode;
    if (mode === "ALL" || (side === "destination" && policy.destination === internetDestination)) return "";
    const addressName = getPolicyAddressName(policy, side, vlans);
    const subnet = getPolicySubnet(policy, side, vlans);
    if (!addressName || !subnet) return "";
    return `    edit \"${addressName}\"
        set subnet ${subnet}
    next`;
  })).filter(Boolean);

  const userGroups = Array.from(new Set(policies.map((policy) => policy.userGroup.trim()).filter(Boolean)));
  const userGroupCli = userGroups.length
    ? `# User groups referenced by policies - เติมสมาชิก user จริงใน FortiGate ก่อนใช้งาน
config user group
${userGroups.map((group) => `    edit \"${group}\"
        set member \"local-user-placeholder\"
    next`).join("\n")}
end`
    : "# No policy user groups defined";

  return `# Address objects generated from detailed policy builder
${addressLines.length ? `config firewall address
${addressLines.join("\n")}
end` : "# No custom address objects required"}

${userGroupCli}`;
}

function buildSecurityProfileCli(blocking: BlockingConfig) {
  const webFilterCli = blocking.enableAdultWebBlock
    ? `# Web Filter: บล็อคเว็บ 18+ / Adult / Pornography / Gambling
# หมายเหตุ: category ID อาจต่างตาม FortiOS build ให้ตรวจสอบกับอุปกรณ์จริงก่อนใช้งาน
config webfilter profile
    edit \"${blocking.webFilterProfileName}\"
        set comment \"Block 18+ websites generated by FortiRule Builder\"
        config ftgd-wf
            config filters
                edit 1
                    set category 2
                    set action block
                next
                edit 2
                    set category 7
                    set action block
                next
                edit 3
                    set category 64
                    set action block
                next
            end
        end
    next
end`
    : "# Web Filter disabled";

  const appControlCli = blocking.enableAppControl
    ? `# Application Control: บล็อคแอพที่เลือก (${blocking.blockedApps.join(", ") || "ยังไม่ได้เลือกแอพ"})
# หมายเหตุ: ให้ตรวจสอบ Application ID / Signature จริงบน FortiGate ก่อนใช้งาน
config application list
    edit \"${blocking.appControlProfileName}\"
        set comment \"Block selected applications generated by FortiRule Builder\"
        config entries
${blocking.blockedApps.map((app, index) => `            edit ${index + 1}
                set application \"${app}\"
                set action block
            next`).join("\n")}
        end
    next
end`
    : "# Application Control disabled";

  return `${webFilterCli}\n\n${appControlCli}`;
}

function buildSecurityProfilePolicyLines(blocking: BlockingConfig) {
  if (!blocking.enableAdultWebBlock && !blocking.enableAppControl) return "        # Security profiles disabled";
  return [
    "        set utm-status enable",
    blocking.enableAdultWebBlock ? `        set webfilter-profile \"${blocking.webFilterProfileName}\"` : "",
    blocking.enableAppControl ? `        set application-list \"${blocking.appControlProfileName}\"` : "",
    "        set ssl-ssh-profile \"certificate-inspection\"",
  ].filter(Boolean).join("\n");
}

function buildPolicyCli(policies: PolicyRule[], vlans: Vlan[], wanInterface: string, blocking: BlockingConfig) {
  return policies
    .map((policy, index) => {
      const source = vlans.find((vlan) => vlan.uid === policy.sourceVlanUid);
      const destination = vlans.find((vlan) => vlan.uid === policy.destination);
      const destinationInterface = policy.destination === internetDestination ? wanInterface : getVlanName(destination);
      const actionText = policy.action === "ACCEPT" ? "อนุญาต" : "ปฏิเสธ";
      const natText = getEffectiveNat(policy) === "enable" ? "เปิด NAT" : "ปิด NAT";
      return `# Policy ${index + 1}: ${policy.name}
# คำอธิบาย: ${actionText} จาก ${getVlanName(source)} ไปยัง ${getDestinationName(policy.destination, vlans)} service ${policy.service} และ ${natText}
config firewall policy
    edit 0
        set name \"${policy.name}\"
        set srcintf \"${getVlanName(source)}\"
        set dstintf \"${destinationInterface}\"
        set srcaddr \"${getPolicyAddressName(policy, "source", vlans)}\"
        set dstaddr \"${getPolicyAddressName(policy, "destination", vlans)}\"
        set action ${policy.action.toLowerCase()}
        set schedule \"${policy.schedule || "always"}\"
        set service \"${policy.service}\"
        ${policy.userGroup.trim() ? `set groups \"${policy.userGroup.trim()}\"` : "# No user group restriction"}
        set logtraffic ${policy.logTraffic ? "all" : "disable"}
${buildSecurityProfilePolicyLines(blocking)}
        set nat ${getEffectiveNat(policy)}
    next
end`;
    })
    .join("\n\n");
}

function buildDefaultRouteCli(form: BasicFortigateForm) {
  if (form.wanConnectionType !== "static") return `# WAN mode ${form.wanConnectionType}: default route is normally received from ISP`;
  return `config router static
    edit 1
        set gateway ${form.wanGateway}
        set device \"${form.wanInterface}\"
    next
end`;
}

function buildVpnCli(form: BasicFortigateForm) {
  if (!form.enableSslVpn) return "# SSL VPN disabled";
  return `# Optional SSL VPN template
config vpn ssl web portal
    edit \"${form.vpnPortalName}\"
        set tunnel-mode enable
        set split-tunneling enable
        set ip-pools \"${form.vpnTunnelIpPool}\"
    next
end

config vpn ssl settings
    set source-interface \"${form.wanInterface}\"
    set source-address \"all\"
    set default-portal \"${form.vpnPortalName}\"
    config authentication-rule
        edit 1
            set groups \"${form.vpnUserGroup}\"
            set portal \"${form.vpnPortalName}\"
        next
    end
end`;
}

function buildConfig(project: ProjectProfile, form: BasicFortigateForm, vlans: Vlan[], policies: PolicyRule[], blocking: BlockingConfig) {
  const syntaxProfile = getSyntaxProfile(form.fortiOsVersion);

  return `# FortiRule Builder - FortiGate Cyber City CLI
# Project: ${project.projectName}
# Engineer: ${project.engineerName}
# Date: ${project.projectDate}
# FortiGate Model: ${form.fortigateModel}
# FortiOS Version: ${form.fortiOsVersion}
# Syntax Profile: ${syntaxProfile.coreSyntax}
# Version Notes: ${syntaxProfile.notes.join(" | ")}
# ตรวจสอบ Syntax กับ FortiOS build จริงก่อนนำไปใช้กับอุปกรณ์จริง
# Frontend only: ไม่มีการเชื่อมต่อ FortiGate จริง

# === WAN / Internet Gateway ===
${buildWanCli(form)}

# === LAN / VLAN + DHCP Zones ===
${buildVlanAndDhcpCli(vlans, form.dnsPrimary, form.dnsSecondary)}

# === DNS / Routing ===
config system dns
    set primary ${form.dnsPrimary}
    set secondary ${form.dnsSecondary}
end

${buildDefaultRouteCli(form)}

# === Firewall Address Objects / User Groups ===
${buildAddressAndUserCli(policies, vlans)}

# === Security Profiles: Web 18+ / Application Block ===
${buildSecurityProfileCli(blocking)}

# === Firewall Policy Roads / NAT ===
${buildPolicyCli(policies, vlans, form.wanInterface, blocking)}

# === VPN Gate ===
${buildVpnCli(form)}

# === Deployment Checklist ===
${deploymentChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}`;
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

function zoneIcon(zone: SelectedZone) {
  return {
    wan: "☁️",
    "vlan-10": "🏢",
    "vlan-20": "💼",
    "vlan-30": "📶",
    "vlan-40": "📹",
    vpn: "🛡️",
    nat: "🗼",
    policy: "🎛️",
    backup: "🔐",
  }[zone];
}

export default function Home() {
  const [project, setProject] = useState<ProjectProfile>(defaultProject);
  const [form, setForm] = useState<BasicFortigateForm>(defaultForm);
  const [vlans, setVlans] = useState<Vlan[]>(defaultVlans);
  const [vlanDraft, setVlanDraft] = useState<VlanDraft>(defaultVlanDraft);
  const [policies, setPolicies] = useState<PolicyRule[]>(defaultPolicies);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(defaultPolicyDraft);
  const [blocking, setBlocking] = useState<BlockingConfig>(defaultBlockingConfig);
  const [copyLabel, setCopyLabel] = useState("Copy CLI");
  const [selectedZone, setSelectedZone] = useState<SelectedZone>("vlan-10");
  const cliRef = useRef<HTMLDivElement>(null);

  const generatedConfig = useMemo(() => buildConfig(project, form, vlans, policies, blocking), [project, form, vlans, policies, blocking]);
  const totalNat = policies.filter((policy) => getEffectiveNat(policy) === "enable").length;
  const completedItems = [true, true, vlans.length > 0, true, policies.length > 0, totalNat > 0, form.enableSslVpn, true].filter(Boolean).length;
  const progress = Math.round((completedItems / deploymentChecklist.length) * 100);
  const selectedVlan = vlans.find((vlan) => vlan.uid === selectedZone);

  const cityZones = [
    { id: "wan" as const, title: "WAN / Internet Gateway", subtitle: form.wanInterface, ip: form.wanConnectionType === "static" ? form.wanIpAddress : form.wanConnectionType.toUpperCase(), grid: "lg:col-start-2 lg:row-start-1" },
    { id: "vlan-10" as const, title: "Server Zone", subtitle: "VLAN10 Server", ip: "192.168.10.1/24 port3", grid: "lg:col-start-1 lg:row-start-3" },
    { id: "vlan-20" as const, title: "Client Office", subtitle: "VLAN20 Client", ip: "192.168.20.1/24 port4", grid: "lg:col-start-2 lg:row-start-4" },
    { id: "vlan-30" as const, title: "WiFi Plaza", subtitle: "VLAN30 WiFi", ip: "192.168.30.1/24 port5", grid: "lg:col-start-3 lg:row-start-3" },
    { id: "vlan-40" as const, title: "CCTV Tower", subtitle: "VLAN40 CCTV", ip: "192.168.40.1/24 port6", grid: "lg:col-start-4 lg:row-start-4" },
    { id: "vpn" as const, title: "VPN Gate", subtitle: form.vpnPortalName, ip: form.vpnAllowedLanSubnet, grid: "lg:col-start-1 lg:row-start-1" },
    { id: "nat" as const, title: "NAT / VIP Tower", subtitle: `${totalNat} NAT policies`, ip: form.wanInterface, grid: "lg:col-start-4 lg:row-start-1" },
    { id: "policy" as const, title: "Policy Control Center", subtitle: `${policies.length} firewall roads`, ip: "ALLOW / DENY matrix", grid: "lg:col-start-1 lg:row-start-5" },
    { id: "backup" as const, title: "Backup Vault", subtitle: "Final config archive", ip: "Checklist + report", grid: "lg:col-start-4 lg:row-start-5" },
  ];

  const updateProject = (key: keyof ProjectProfile) => (event: ChangeEvent<HTMLInputElement>) => setProject((current) => ({ ...current, [key]: event.target.value }));
  const updateField = (key: keyof BasicFortigateForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };
  const updateVlanDraft = (key: keyof VlanDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setVlanDraft((current) => ({ ...current, [key]: key === "allowInternet" ? value === "yes" : value }));
  };
  const updateVlan = (uid: string, key: keyof Vlan) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setVlans((current) => current.map((vlan) => (vlan.uid === uid ? { ...vlan, [key]: key === "allowInternet" ? value === "yes" : value } : vlan)));
  };
  const updatePolicyDraft = (key: keyof PolicyDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setPolicyDraft((current) => ({ ...current, [key]: value }));
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
  const scrollToCli = () => cliRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const updateBlocking = (key: keyof BlockingConfig) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setBlocking((current) => ({ ...current, [key]: value }));
  };
  const toggleBlockedApp = (app: BlockApp) => (event: ChangeEvent<HTMLInputElement>) => {
    setBlocking((current) => ({
      ...current,
      blockedApps: event.target.checked ? [...current.blockedApps, app] : current.blockedApps.filter((item) => item !== app),
    }));
  };

  const renderSelectedZoneEditor = () => {
    if (selectedVlan) {
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Zone Editor</p>
              <h3 className="text-xl font-black text-white">{getVlanName(selectedVlan)}</h3>
              <p className="text-sm text-slate-400">คลิกอาคาร VLAN แล้วปรับ gateway, subnet และ DHCP ได้ทันที</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass("Ready")}`}>Ready</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="VLAN Name"><input className={inputClass} value={selectedVlan.name} onChange={updateVlan(selectedVlan.uid, "name")} /></Field>
            <Field label="VLAN ID"><input className={inputClass} value={selectedVlan.vlanId} onChange={updateVlan(selectedVlan.uid, "vlanId")} /></Field>
            <Field label="Interface"><input className={inputClass} value={selectedVlan.interfaceName} onChange={updateVlan(selectedVlan.uid, "interfaceName")} /></Field>
            <Field label="Gateway IP"><input className={inputClass} value={selectedVlan.gatewayIp} onChange={updateVlan(selectedVlan.uid, "gatewayIp")} /></Field>
            <Field label="Subnet Mask"><input className={inputClass} value={selectedVlan.subnetMask} onChange={updateVlan(selectedVlan.uid, "subnetMask")} /></Field>
            <Field label="Allow Internet"><select className={inputClass} value={selectedVlan.allowInternet ? "yes" : "no"} onChange={updateVlan(selectedVlan.uid, "allowInternet")}><option value="yes">Ready - Allow Internet</option><option value="no">Warning - Internal Only</option></select></Field>
            <Field label="DHCP Start"><input className={inputClass} value={selectedVlan.dhcpStartIp} onChange={updateVlan(selectedVlan.uid, "dhcpStartIp")} /></Field>
            <Field label="DHCP End"><input className={inputClass} value={selectedVlan.dhcpEndIp} onChange={updateVlan(selectedVlan.uid, "dhcpEndIp")} /></Field>
          </div>
        </div>
      );
    }

    if (selectedZone === "wan") {
      return (
        <div className="space-y-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">WAN Gateway</p><h3 className="text-xl font-black text-white">ตั้งค่า Internet Gateway</h3><p className="text-sm text-slate-400">กำหนด WAN interface และ route สำหรับออก Internet</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WAN Interface"><input className={inputClass} value={form.wanInterface} onChange={updateField("wanInterface")} /></Field>
            <Field label="Connection Type"><select className={inputClass} value={form.wanConnectionType} onChange={updateField("wanConnectionType")}><option value="static">Static IP</option><option value="dhcp">DHCP</option><option value="pppoe">PPPoE</option></select></Field>
            <Field label="IP Address"><input className={inputClass} value={form.wanIpAddress} onChange={updateField("wanIpAddress")} /></Field>
            <Field label="Subnet Mask"><input className={inputClass} value={form.wanSubnetMask} onChange={updateField("wanSubnetMask")} /></Field>
            <Field label="Gateway"><input className={inputClass} value={form.wanGateway} onChange={updateField("wanGateway")} /></Field>
            <Field label="PPPoE Username"><input className={inputClass} value={form.pppoeUsername} onChange={updateField("pppoeUsername")} /></Field>
          </div>
        </div>
      );
    }

    if (selectedZone === "vpn") {
      return (
        <div className="space-y-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">VPN Gate</p><h3 className="text-xl font-black text-white">SSL VPN Access</h3><p className="text-sm text-slate-400">เปิด/ปิดประตู VPN และกำหนด tunnel pool</p></div>
          <label className="flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm font-bold text-cyan-100">
            Enable SSL VPN
            <input className="h-5 w-5 accent-cyan-300" type="checkbox" checked={form.enableSslVpn} onChange={updateField("enableSslVpn")} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="VPN User Group"><input className={inputClass} value={form.vpnUserGroup} onChange={updateField("vpnUserGroup")} /></Field>
            <Field label="Tunnel IP Pool"><input className={inputClass} value={form.vpnTunnelIpPool} onChange={updateField("vpnTunnelIpPool")} /></Field>
            <Field label="Allowed LAN Subnet"><input className={inputClass} value={form.vpnAllowedLanSubnet} onChange={updateField("vpnAllowedLanSubnet")} /></Field>
            <Field label="Portal Name"><input className={inputClass} value={form.vpnPortalName} onChange={updateField("vpnPortalName")} /></Field>
          </div>
        </div>
      );
    }

    if (selectedZone === "policy" || selectedZone === "nat") {
      return (
        <div className="space-y-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Policy Control Center</p><h3 className="text-xl font-black text-white">Firewall Policy Roads / NAT</h3><p className="text-sm text-slate-400">ถนนเรืองแสงบนแผนที่คือ policy ที่เชื่อม zone ต่าง ๆ</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Policy Name"><input className={inputClass} value={policyDraft.name} onChange={updatePolicyDraft("name")} /></Field>
            <Field label="Source VLAN"><select className={inputClass} value={policyDraft.sourceVlanUid} onChange={updatePolicyDraft("sourceVlanUid")}>{vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}</select></Field>
            <Field label="Destination"><select className={inputClass} value={policyDraft.destination} onChange={updatePolicyDraft("destination")}><option value={internetDestination}>Internet</option>{vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}</select></Field>
            <Field label="Source Address"><select className={inputClass} value={policyDraft.sourceAddressMode} onChange={updatePolicyDraft("sourceAddressMode")}>{addressModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></Field>
            <Field label="Src Addr Name"><input className={inputClass} value={policyDraft.sourceAddressName} onChange={updatePolicyDraft("sourceAddressName")} /></Field>
            <Field label="Src Subnet"><input className={inputClass} value={policyDraft.sourceSubnet} onChange={updatePolicyDraft("sourceSubnet")} /></Field>
            <Field label="Destination Address"><select className={inputClass} value={policyDraft.destinationAddressMode} onChange={updatePolicyDraft("destinationAddressMode")}>{addressModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></Field>
            <Field label="Dst Addr Name"><input className={inputClass} value={policyDraft.destinationAddressName} onChange={updatePolicyDraft("destinationAddressName")} /></Field>
            <Field label="Dst Subnet"><input className={inputClass} value={policyDraft.destinationSubnet} onChange={updatePolicyDraft("destinationSubnet")} /></Field>
            <Field label="User Group"><input className={inputClass} placeholder="เช่น HR_Users หรือเว้นว่าง" value={policyDraft.userGroup} onChange={updatePolicyDraft("userGroup")} /></Field>
            <Field label="Schedule"><input className={inputClass} value={policyDraft.schedule} onChange={updatePolicyDraft("schedule")} /></Field>
            <Field label="Service"><select className={inputClass} value={policyDraft.service} onChange={updatePolicyDraft("service")}>{firewallServices.map((service) => <option key={service}>{service}</option>)}</select></Field>
            <Field label="Action"><select className={inputClass} value={policyDraft.action} onChange={updatePolicyDraft("action")}><option value="ACCEPT">ALLOW</option><option value="DENY">DENY</option></select></Field>
            <Field label="NAT"><select className={inputClass} value={policyDraft.nat} onChange={updatePolicyDraft("nat")}><option value="AUTO">AUTO</option><option value="ENABLE">Enable</option><option value="DISABLE">Disable</option></select></Field>
            <label className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-sm font-bold text-cyan-100">Log Traffic<input className="h-5 w-5 accent-cyan-300" type="checkbox" checked={policyDraft.logTraffic} onChange={updatePolicyDraft("logTraffic")} /></label>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
            <div className="mb-3">
              <p className="text-sm font-black text-white">Web 18+ / App Blocking</p>
              <p className="text-xs text-slate-400">เปิด Security Profile เพื่อบล็อคเว็บผู้ใหญ่และแอพบางตัวบน policy ที่สร้าง</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-slate-950/50 px-3 py-2 text-sm font-bold text-cyan-100">Block Web 18+<input className="h-5 w-5 accent-cyan-300" type="checkbox" checked={blocking.enableAdultWebBlock} onChange={updateBlocking("enableAdultWebBlock")} /></label>
              <label className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-slate-950/50 px-3 py-2 text-sm font-bold text-cyan-100">Block Apps<input className="h-5 w-5 accent-cyan-300" type="checkbox" checked={blocking.enableAppControl} onChange={updateBlocking("enableAppControl")} /></label>
              <Field label="Web Filter Profile"><input className={inputClass} value={blocking.webFilterProfileName} onChange={updateBlocking("webFilterProfileName")} /></Field>
              <Field label="App Control Profile"><input className={inputClass} value={blocking.appControlProfileName} onChange={updateBlocking("appControlProfileName")} /></Field>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {blockableApps.map((app) => (
                <label key={app} className="flex items-center justify-between rounded-xl border border-cyan-300/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">{app}<input className="h-4 w-4 accent-cyan-300" type="checkbox" checked={blocking.blockedApps.includes(app)} onChange={toggleBlockedApp(app)} /></label>
              ))}
            </div>
          </div>
          <button onClick={addPolicy} className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25" type="button">+ Add Policy Road</button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Backup Vault</p><h3 className="text-xl font-black text-white">Firmware / Backup Checklist</h3><p className="text-sm text-slate-400">ไม่สร้างคำสั่ง firmware จริง ใช้เป็น checklist ก่อน deploy</p></div>
        <div className="space-y-2">
          {deploymentChecklist.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-slate-900/60 p-3 text-sm text-slate-200"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/10 text-xs font-black text-cyan-200">{index + 1}</span>{item}</div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_78%_8%,rgba(99,102,241,0.22),transparent_24%),linear-gradient(135deg,#020617_0%,#071633_52%,#020617_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-cyan-300/20 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl lg:block">
        <div className="mb-8 rounded-[1.5rem] border border-cyan-300/30 bg-cyan-300/10 p-4 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950 shadow-lg shadow-cyan-400/40">FR</div>
            <div>
              <h1 className="font-black text-white">FortiRule Builder</h1>
              <p className="text-xs text-cyan-200">Cyber City NOC</p>
            </div>
          </div>
        </div>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <button key={item} onClick={item === "Export" ? scrollToCli : undefined} className="flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-bold text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/10 hover:text-cyan-100" type="button">
              {item}<span className="text-cyan-400">◈</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100">
          ตรวจสอบ Syntax กับ FortiOS build จริงก่อนนำไปใช้กับอุปกรณ์จริง
        </div>
      </aside>

      <div className="relative z-10 lg:pl-64">
        <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-4 p-4 xl:p-5">
          <header className={`${panelClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
              <Field label="Project Name"><input className={inputClass} value={project.projectName} onChange={updateProject("projectName")} /></Field>
              <Field label="Engineer"><input className={inputClass} value={project.engineerName} onChange={updateProject("engineerName")} /></Field>
              <Field label="Date"><input className={inputClass} type="date" value={project.projectDate} onChange={updateProject("projectDate")} /></Field>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="FortiGate Model"><select className={inputClass} value={form.fortigateModel} onChange={updateField("fortigateModel")}>{fortigateModels.map((model) => <option key={model} value={model}>{model}</option>)}</select></Field>
              <Field label="FortiOS Version"><select className={inputClass} value={form.fortiOsVersion} onChange={updateField("fortiOsVersion")}>{fortiOsVersions.map((version) => <option key={version} value={version}>{version}</option>)}</select></Field>
              <button onClick={scrollToCli} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/30" type="button">Generate CLI</button>
              <button onClick={exportTxt} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-300/10" type="button">Export</button>
            </div>
          </header>

          <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className={`${panelClass} relative min-h-[740px] overflow-hidden p-4 sm:p-6`}>
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_25%,transparent_25%),linear-gradient(225deg,rgba(14,165,233,0.12)_25%,transparent_25%)] bg-[length:72px_72px]" />
              <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">FortiGate Cyber City</p>
                  <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">Network Map Command Center</h2>
                  <p className="mt-1 text-sm text-slate-400">คลิกอาคารแต่ละ Zone เพื่อแก้ config — ถนนเรืองแสงคือ Firewall Policy</p>
                </div>
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                  {getSyntaxProfile(form.fortiOsVersion).notes.join(" • ")}
                </div>
              </div>

              <div className="relative z-10 grid min-h-[560px] gap-4 lg:grid-cols-4 lg:grid-rows-5">
                <div className="pointer-events-none absolute left-[14%] right-[14%] top-[22%] hidden h-px bg-cyan-300/40 shadow-[0_0_18px_rgba(34,211,238,0.9)] lg:block" />
                <div className="pointer-events-none absolute bottom-[24%] left-[16%] right-[16%] hidden h-px border-t border-dashed border-cyan-300/40 lg:block" />
                <div className="pointer-events-none absolute left-1/2 top-[12%] hidden h-[72%] w-px -translate-x-1/2 border-l border-dashed border-sky-300/40 lg:block" />
                <div className="pointer-events-none absolute left-[28%] top-[38%] hidden h-3 w-3 animate-ping rounded-full bg-cyan-300 lg:block" />
                <div className="pointer-events-none absolute right-[30%] top-[58%] hidden h-3 w-3 animate-ping rounded-full bg-blue-300 [animation-delay:600ms] lg:block" />

                {cityZones.map((zone) => {
                  const status = getZoneStatus(zone.id, form, vlans, policies);
                  const isSelected = selectedZone === zone.id;
                  return (
                    <button key={zone.id} onClick={() => setSelectedZone(zone.id)} className={`${buildingBaseClass} ${zone.grid} ${isSelected ? "border-cyan-200 bg-cyan-300/15 shadow-cyan-400/30" : ""}`} type="button">
                      <div className="absolute inset-x-3 bottom-0 h-8 rounded-t-2xl bg-gradient-to-t from-cyan-300/20 to-transparent blur-sm" />
                      <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-cyan-300/10 blur-xl" />
                      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-3xl drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">{zoneIcon(zone.id)}</span>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusClass(status)}`}>{status}</span>
                        </div>
                        <div>
                          <p className="font-black text-white">{zone.title}</p>
                          <p className="text-xs font-bold text-cyan-200">{zone.subtitle}</p>
                          <p className="mt-2 text-xs text-slate-400">{zone.ip}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="lg:col-start-2 lg:col-span-2 lg:row-start-2 lg:row-span-2">
                  <button onClick={() => setSelectedZone("policy")} className="relative h-full min-h-44 w-full overflow-hidden rounded-[2rem] border border-cyan-200/50 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-indigo-600/20 p-6 text-left shadow-2xl shadow-cyan-500/30" type="button">
                    <div className="absolute inset-4 rounded-[1.5rem] border border-cyan-200/20" />
                    <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-5xl">🏙️</span>
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">HQ Online</span>
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-white">FortiGate HQ</h3>
                        <p className="text-sm text-cyan-100">{form.fortigateModel} / FortiOS {form.fortiOsVersion}</p>
                        <p className="mt-2 text-xs text-slate-300">ศูนย์กลางควบคุม traffic, NAT, VPN และ policy ทั้งเมือง</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <section className={`${panelClass} p-4`}>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Summary</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {[['Model', form.fortigateModel], ['FortiOS', form.fortiOsVersion], ['Total VLAN', String(vlans.length)], ['Total Policy', String(policies.length)], ['NAT Status', `${totalNat} Enable`], ['18+ Block', blocking.enableAdultWebBlock ? 'Enabled' : 'Disabled'], ['App Block', blocking.enableAppControl ? `${blocking.blockedApps.length} Apps` : 'Disabled'], ['VPN Status', form.enableSslVpn ? 'Ready' : 'Disabled']].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-1 font-black text-cyan-100">{value}</p></div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">ตรวจสอบ Syntax กับ FortiOS build จริงก่อนนำ CLI ไปใช้งานจริง</div>
              </section>

              <section className={`${panelClass} p-4`}>
                <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Deployment</p><span className="font-black text-cyan-100">{progress}%</span></div>
                <div className="mt-3 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${progress}%` }} /></div>
                <div className="mt-4 space-y-2">
                  {deploymentChecklist.map((item, index) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${index < completedItems ? "bg-emerald-300" : "bg-slate-600"}`} />{item}</div>
                  ))}
                </div>
              </section>

              <section className={`${panelClass} p-4`}>{renderSelectedZoneEditor()}</section>
            </aside>
          </div>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Zone Inventory</p>
                <h2 className="text-lg font-black text-white">VLAN Configuration Grid</h2>
              </div>
              <button onClick={addVlan} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/25" type="button">+ Add VLAN Building</button>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <Field label="VLAN ID"><input className={inputClass} value={vlanDraft.vlanId} onChange={updateVlanDraft("vlanId")} /></Field>
              <Field label="Name"><input className={inputClass} value={vlanDraft.name} onChange={updateVlanDraft("name")} /></Field>
              <Field label="Interface"><input className={inputClass} value={vlanDraft.interfaceName} onChange={updateVlanDraft("interfaceName")} /></Field>
              <Field label="Gateway"><input className={inputClass} value={vlanDraft.gatewayIp} onChange={updateVlanDraft("gatewayIp")} /></Field>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.15em] text-cyan-200/70"><tr><th className="px-4 py-3">ID</th><th>Name</th><th>Interface</th><th>Gateway</th><th>Subnet</th><th>DHCP</th><th>Action</th></tr></thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {vlans.map((vlan) => (
                    <tr key={vlan.uid} className="hover:bg-cyan-300/5"><td className="px-4 py-3 font-black text-cyan-100">{vlan.vlanId}</td><td>{vlan.name}</td><td>{vlan.interfaceName}</td><td>{vlan.gatewayIp}</td><td>{vlan.subnetMask}</td><td>{vlan.dhcpStartIp} - {vlan.dhcpEndIp}</td><td><button onClick={() => setVlans((current) => current.filter((item) => item.uid !== vlan.uid))} className="text-red-300" type="button">Delete</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Policy Roads</p>
                <h2 className="text-lg font-black text-white">Firewall Policy Matrix</h2>
              </div>
              <button onClick={() => setSelectedZone("policy")} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-300/10" type="button">Open Policy Control</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-xs uppercase tracking-[0.15em] text-cyan-200/70"><tr><th className="px-4 py-3">ID</th><th>Source</th><th>Src Addr</th><th>Destination</th><th>Dst Addr</th><th>User Group</th><th>Service</th><th>Action</th><th>NAT</th><th>Status</th></tr></thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {policies.map((policy, index) => (
                    <tr key={policy.uid} className="hover:bg-cyan-300/5"><td className="px-4 py-3">{index + 1}</td><td>{getVlanName(vlans.find((vlan) => vlan.uid === policy.sourceVlanUid))}</td><td>{getPolicyAddressName(policy, "source", vlans)}</td><td>{getDestinationName(policy.destination, vlans)}</td><td>{getPolicyAddressName(policy, "destination", vlans)}</td><td>{policy.userGroup || "-"}</td><td>{policy.service}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${policy.action === "ACCEPT" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{policy.action === "ACCEPT" ? "ALLOW" : "DENY"}</span></td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${getEffectiveNat(policy) === "enable" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{getNatLabel(policy)}</span></td><td><span className="text-emerald-300">Ready</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section ref={cliRef} className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/20 p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Generated CLI Terminal</p>
                <h2 className="text-xl font-black text-white">FortiGate Cyber City Config Output</h2>
                <p className="text-xs text-amber-100">ตรวจสอบค่าอีกครั้งก่อนนำไปใช้กับอุปกรณ์จริง</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={copyConfig} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950" type="button">{copyLabel}</button>
                <button onClick={exportTxt} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100" type="button">Download TXT</button>
                <button onClick={exportPdf} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100" type="button">Download PDF</button>
                <button onClick={exportReport} className="rounded-2xl border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100" type="button">Implementation Report</button>
                <button onClick={saveProject} className="rounded-2xl border border-blue-300/40 px-4 py-2 text-sm font-black text-blue-100" type="button">Save Project</button>
              </div>
            </div>
            <pre className="max-h-[520px] overflow-auto bg-[#010712] p-5 font-mono text-sm leading-6 shadow-inner shadow-cyan-950/40">{generatedConfig.split("\n").map(renderCliLine)}</pre>
          </section>
        </div>
      </div>
    </main>
  );
}
