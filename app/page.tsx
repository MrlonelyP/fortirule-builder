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

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-2 block text-sm font-medium text-slate-200";
const sectionClass = "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur";

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
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span> : null}
    </label>
  );
}

function StepCard({ step, title, description, children }: { step: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className={sectionClass}>
      <div className="mb-5 flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 font-black text-slate-950">
          {step}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
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
        <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-cyan-300/60 text-xs text-cyan-200">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function getWanModeLabel(type: WanConnectionType) {
  if (type === "dhcp") return "DHCP จากผู้ให้บริการ";
  if (type === "pppoe") return "PPPoE ด้วย Username/Password";
  return "Static IP จากผู้ให้บริการ";
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
  return `# FortiRule Builder - Basic FortiGate First Implementation\n# คอนฟิกนี้สร้างจากหน้าเว็บฝั่ง Frontend เท่านั้น ไม่มีการเชื่อมต่อ FortiGate จริง\n# กรุณาตรวจสอบชื่อ Interface, IP, Gateway, DNS, User Group และ License ก่อนนำไปใช้จริง\n\n# 1) WAN Internet Setup\n# คำอธิบาย: ตั้งค่า ${form.wanInterface} เป็นขาออกอินเทอร์เน็ตแบบ ${getWanModeLabel(form.wanConnectionType)}\n${buildWanCli(form)}\n\n# 2) LAN Setup\n# คำอธิบาย: ตั้งค่า ${form.lanInterface} เป็น Gateway ของเครือข่ายภายใน\nconfig system interface\n    edit "${form.lanInterface}"\n        set role lan\n        set mode static\n        set ip ${form.lanIpAddress} ${form.lanSubnetMask}\n        set allowaccess ping https ssh\n    next\nend\n\n# 3) DHCP Server\n# คำอธิบาย: แจก IP ให้ Client ใน LAN พร้อม Gateway และ DNS\nconfig system dhcp server\n    edit 1\n        set interface "${form.lanInterface}"\n        set default-gateway ${form.dhcpGateway}\n        set netmask ${form.lanSubnetMask}\n        set dns-service specify\n        set dns-server1 ${form.dnsPrimary}\n        set dns-server2 ${form.dnsSecondary}\n        config ip-range\n            edit 1\n                set start-ip ${form.dhcpStartIp}\n                set end-ip ${form.dhcpEndIp}\n            next\n        end\n    next\nend\n\n# 4) DNS and Default Gateway\n# คำอธิบาย: ตั้งค่า DNS ของ FortiGate และ Default Route สำหรับออกอินเทอร์เน็ต\nconfig system dns\n    set primary ${form.dnsPrimary}\n    set secondary ${form.dnsSecondary}\nend\n\n${buildDefaultRouteCli(form)}\n\n# 5) Basic Firewall Policy - LAN to Internet\n# คำอธิบาย: อนุญาตให้ LAN ออก Internet ได้ทุก Service และเปิด NAT เพื่อแปลง IP ภายในเป็น IP ขา WAN\nconfig firewall policy\n    edit 0\n        set name "LAN_to_Internet"\n        set srcintf "${form.lanInterface}"\n        set dstintf "${form.wanInterface}"\n        set srcaddr "all"\n        set dstaddr "all"\n        set action accept\n        set schedule "always"\n        set service "ALL"\n        set logtraffic all\n        set nat enable\n    next\nend\n\n# 6) Optional SSL VPN\n# คำอธิบาย: ส่วนนี้ใช้เมื่อเปิด Toggle SSL VPN เท่านั้น และเป็น Template พื้นฐานสำหรับให้ VPN เข้าถึง LAN\n${buildVpnCli(form)}\n\n# 7) Firmware and Backup Checklist\n# คำอธิบาย: รายการนี้เป็น Checklist เท่านั้น ไม่สร้างคำสั่งอัปเกรด Firmware จริง\n${firmwareChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}\n\n# 8) Testing Checklist\n# คำอธิบาย: ใช้ตรวจสอบหลังติดตั้งเสร็จสำหรับ Engineer มือใหม่\n${testingChecklist.map((item, index) => `# [ ] ${index + 1}. ${item}`).join("\n")}`;
}

export default function Home() {
  const [form, setForm] = useState<BasicFortigateForm>(defaultForm);
  const [copyLabel, setCopyLabel] = useState("คัดลอก CLI");

  const generatedConfig = useMemo(() => buildConfig(form), [form]);

  const updateField = (key: keyof BasicFortigateForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopyLabel("คัดลอกแล้ว ✓");
    window.setTimeout(() => setCopyLabel("คัดลอก CLI"), 1800);
  };

  const exportConfig = () => {
    const blob = new Blob([generatedConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "basic-fortigate-first-implementation.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#164e63,transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-200">FortiRule Builder</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black text-white sm:text-5xl">Basic FortiGate First Implementation</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Wizard ภาษาไทยสำหรับ Engineer มือใหม่ ใช้กรอกข้อมูล WAN, LAN, DHCP, Firewall Policy, DNS, Gateway และ Optional SSL VPN แล้วสร้าง FortiGate CLI แบบครบชุด โดยไม่เชื่อมต่อ FortiGate จริง
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-200/20 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p className="font-bold text-cyan-100">โหมด Frontend Only</p>
              <p className="mt-1">Copy หรือ Export แล้วนำไปตรวจสอบก่อนใช้งานจริง</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
          <div className="space-y-6">
            <StepCard step="1" title="ตั้งค่า WAN Internet" description="กรอกข้อมูลขาออกอินเทอร์เน็ตจาก ISP เลือก Static IP, DHCP หรือ PPPoE ตามวงจรจริง">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="WAN interface">
                  <input className={inputClass} value={form.wanInterface} onChange={updateField("wanInterface")} placeholder="wan1" />
                </Field>
                <Field label="ประเภทการเชื่อมต่อ">
                  <select className={inputClass} value={form.wanConnectionType} onChange={updateField("wanConnectionType")}>
                    <option value="static">Static IP</option>
                    <option value="dhcp">DHCP</option>
                    <option value="pppoe">PPPoE</option>
                  </select>
                </Field>
                <Field label="IP address" hint="ใช้เมื่อเป็น Static IP">
                  <input className={inputClass} value={form.wanIpAddress} onChange={updateField("wanIpAddress")} placeholder="203.0.113.10" />
                </Field>
                <Field label="Subnet mask" hint="ใช้เมื่อเป็น Static IP">
                  <input className={inputClass} value={form.wanSubnetMask} onChange={updateField("wanSubnetMask")} placeholder="255.255.255.248" />
                </Field>
                <Field label="Gateway" hint="ใช้สร้าง Default Route เมื่อเป็น Static IP">
                  <input className={inputClass} value={form.wanGateway} onChange={updateField("wanGateway")} placeholder="203.0.113.9" />
                </Field>
                <Field label="PPPoE username">
                  <input className={inputClass} value={form.pppoeUsername} onChange={updateField("pppoeUsername")} placeholder="username จาก ISP" />
                </Field>
                <Field label="PPPoE password">
                  <input className={inputClass} value={form.pppoePassword} onChange={updateField("pppoePassword")} placeholder="password จาก ISP" type="password" />
                </Field>
              </div>
            </StepCard>

            <StepCard step="2" title="ตั้งค่า LAN" description="ตั้ง IP ฝั่งภายในให้เป็น Gateway หลักของเครื่อง Client">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="LAN interface">
                  <input className={inputClass} value={form.lanInterface} onChange={updateField("lanInterface")} placeholder="lan" />
                </Field>
                <Field label="LAN IP address">
                  <input className={inputClass} value={form.lanIpAddress} onChange={updateField("lanIpAddress")} placeholder="192.168.1.1" />
                </Field>
                <Field label="Subnet mask">
                  <input className={inputClass} value={form.lanSubnetMask} onChange={updateField("lanSubnetMask")} placeholder="255.255.255.0" />
                </Field>
              </div>
            </StepCard>

            <StepCard step="3" title="ตั้งค่า DHCP Server" description="กำหนดช่วง IP, DNS และ Gateway ที่จะแจกให้เครื่อง Client ใน LAN">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="DHCP start IP">
                  <input className={inputClass} value={form.dhcpStartIp} onChange={updateField("dhcpStartIp")} placeholder="192.168.1.100" />
                </Field>
                <Field label="DHCP end IP">
                  <input className={inputClass} value={form.dhcpEndIp} onChange={updateField("dhcpEndIp")} placeholder="192.168.1.200" />
                </Field>
                <Field label="DNS primary">
                  <input className={inputClass} value={form.dnsPrimary} onChange={updateField("dnsPrimary")} placeholder="8.8.8.8" />
                </Field>
                <Field label="DNS secondary">
                  <input className={inputClass} value={form.dnsSecondary} onChange={updateField("dnsSecondary")} placeholder="1.1.1.1" />
                </Field>
                <Field label="Gateway">
                  <input className={inputClass} value={form.dhcpGateway} onChange={updateField("dhcpGateway")} placeholder="192.168.1.1" />
                </Field>
              </div>
            </StepCard>

            <StepCard step="4" title="Basic Firewall Policy" description="สร้าง Policy พื้นฐาน LAN ไป Internet: Service ALL, Action ACCEPT และ NAT Enable อัตโนมัติ">
              <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><p className="text-slate-400">ต้นทาง</p><p className="mt-1 font-bold">{form.lanInterface}</p></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><p className="text-slate-400">ปลายทาง</p><p className="mt-1 font-bold">{form.wanInterface}</p></div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><p className="text-slate-400">Service / Action</p><p className="mt-1 font-bold">ALL / ACCEPT</p></div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"><p className="text-emerald-100">NAT</p><p className="mt-1 font-bold text-emerald-50">Enable</p></div>
              </div>
            </StepCard>

            <StepCard step="5" title="Optional SSL VPN" description="เปิดเฉพาะเมื่อไซต์นี้ต้องการให้ผู้ใช้นอกองค์กร VPN เข้ามาใช้งาน LAN">
              <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <input checked={form.enableSslVpn} className="h-5 w-5 accent-cyan-300" onChange={updateField("enableSslVpn")} type="checkbox" />
                <span className="font-bold text-white">Enable SSL VPN</span>
              </label>
              {form.enableSslVpn ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="VPN user group">
                    <input className={inputClass} value={form.vpnUserGroup} onChange={updateField("vpnUserGroup")} placeholder="SSLVPN_Users" />
                  </Field>
                  <Field label="Tunnel IP pool">
                    <input className={inputClass} value={form.vpnTunnelIpPool} onChange={updateField("vpnTunnelIpPool")} placeholder="SSLVPN_TUNNEL_ADDR1" />
                  </Field>
                  <Field label="Allowed LAN subnet" hint="รูปแบบ FortiGate เช่น 192.168.1.0 255.255.255.0">
                    <input className={inputClass} value={form.vpnAllowedLanSubnet} onChange={updateField("vpnAllowedLanSubnet")} placeholder="192.168.1.0 255.255.255.0" />
                  </Field>
                  <Field label="VPN portal name">
                    <input className={inputClass} value={form.vpnPortalName} onChange={updateField("vpnPortalName")} placeholder="full-access" />
                  </Field>
                </div>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">ยังไม่เปิด SSL VPN จึงจะไม่สร้างคำสั่ง VPN ใน CLI</p>
              )}
            </StepCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <StepCard step="6" title="Firmware และ Backup Checklist" description="เป็น Checklist เท่านั้น ไม่มีคำสั่ง Upgrade Firmware จริงเพื่อความปลอดภัย">
                <Checklist items={firmwareChecklist} />
              </StepCard>
              <StepCard step="7" title="Testing Checklist" description="ใช้ตรวจสอบระบบหลังติดตั้งเสร็จและก่อนส่งมอบงาน">
                <Checklist items={testingChecklist} />
              </StepCard>
            </div>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-3xl border border-cyan-200/20 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">คอนฟิก CLI สำหรับ FortiGate</h2>
                  <p className="text-sm text-slate-400">ผลลัพธ์อัปเดตทันทีจากข้อมูลใน Wizard</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copyConfig} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
                    {copyLabel}
                  </button>
                  <button type="button" onClick={exportConfig} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
                    ส่งออก .txt
                  </button>
                </div>
              </div>
              <pre className="max-h-[78vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 p-5 text-sm leading-6 text-cyan-50 shadow-inner">
                <code>{generatedConfig}</code>
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
