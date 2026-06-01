"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

type Vlan = {
  id: string;
  name: string;
  interface: string;
  ip: string;
  mask: string;
  allowAccess: string;
};

type Dhcp = {
  enabled: boolean;
  vlanId: string;
  gateway: string;
  startIp: string;
  endIp: string;
  netmask: string;
  dns1: string;
  dns2: string;
  leaseTime: string;
};

type FirewallPolicy = {
  name: string;
  srcintf: string;
  dstintf: string;
  srcaddr: string;
  dstaddr: string;
  schedule: string;
  service: string;
  action: "accept" | "deny";
  logtraffic: "all" | "utm" | "disable";
  nat: boolean;
};

type NatRule = {
  name: string;
  mode: "outbound" | "vip";
  extintf: string;
  mappedIp: string;
  extIp: string;
  extPort: string;
  mappedPort: string;
  protocol: "tcp" | "udp";
};

const inputClass =
  "w-full rounded-2xl border border-cyan-300/15 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80";

const defaultVlan: Vlan = {
  id: "10",
  name: "VLAN10_USERS",
  interface: "port2",
  ip: "192.168.10.1",
  mask: "255.255.255.0",
  allowAccess: "ping https ssh",
};

const defaultDhcp: Dhcp = {
  enabled: true,
  vlanId: "10",
  gateway: "192.168.10.1",
  startIp: "192.168.10.100",
  endIp: "192.168.10.200",
  netmask: "255.255.255.0",
  dns1: "8.8.8.8",
  dns2: "1.1.1.1",
  leaseTime: "86400",
};

const defaultPolicy: FirewallPolicy = {
  name: "LAN_to_WAN",
  srcintf: "VLAN10_USERS",
  dstintf: "wan1",
  srcaddr: "all",
  dstaddr: "all",
  schedule: "always",
  service: "ALL",
  action: "accept",
  logtraffic: "all",
  nat: true,
};

const defaultNat: NatRule = {
  name: "WEB_Server_VIP",
  mode: "vip",
  extintf: "wan1",
  mappedIp: "192.168.10.10",
  extIp: "203.0.113.10",
  extPort: "443",
  mappedPort: "443",
  protocol: "tcp",
};

const modules = [
  { label: "WAN", desc: "Internet uplink", icon: "🌐" },
  { label: "LAN", desc: "Internal gateway", icon: "🧩" },
  { label: "VLAN", desc: "Network segment", icon: "🕸️" },
  { label: "DHCP", desc: "Client IP service", icon: "📡" },
  { label: "Policy", desc: "Traffic control", icon: "🛡️" },
  { label: "NAT", desc: "Internet access", icon: "🔁" },
  { label: "VPN", desc: "Optional remote", icon: "🔐" },
  { label: "Export", desc: "CLI / TXT", icon: "⬇️" },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Card({ title, description, badge, children }: { title: string; description: string; badge?: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.7rem] border border-cyan-300/15 bg-slate-950/65 p-5 shadow-2xl shadow-slate-950/35 backdrop-blur">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {badge ? <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">{badge}</span> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function StatusCard({ title, value, status }: { title: string; value: string; status: "ok" | "wait" | "off" }) {
  const styles = {
    ok: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
    wait: "bg-amber-400/10 text-amber-200 border-amber-300/20",
    off: "bg-slate-400/10 text-slate-300 border-slate-300/15",
  }[status];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-slate-400">{title}</p>
        <span className={`rounded-full border px-2 py-1 text-[0.65rem] font-bold ${styles}`}>
          {status === "ok" ? "พร้อมใช้" : status === "wait" ? "รอตรวจ" : "ปิด"}
        </span>
      </div>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function buildConfig(vlan: Vlan, dhcp: Dhcp, policy: FirewallPolicy, nat: NatRule) {
  const vlanName = vlan.name.trim() || `VLAN${vlan.id}`;
  const vlanId = vlan.id.trim() || "10";
  const configParts = [
    `# FortiRule Builder - Generated FortiGate CLI\n# ตรวจสอบค่า Interface, IP และ Policy ID ก่อนนำไปใช้งานจริง`,
    `# ========== VLAN INTERFACE ==========\nconfig system interface\n    edit "${vlanName}"\n        set vdom "root"\n        set interface "${vlan.interface}"\n        set vlanid ${vlanId}\n        set ip ${vlan.ip} ${vlan.mask}\n        set allowaccess ${vlan.allowAccess}\n    next\nend`,
  ];

  if (dhcp.enabled) {
    configParts.push(
      `# ========== DHCP SERVER ==========\nconfig system dhcp server\n    edit 0\n        set interface "${vlanName}"\n        set default-gateway ${dhcp.gateway}\n        set netmask ${dhcp.netmask}\n        set lease-time ${dhcp.leaseTime}\n        set dns-service specify\n        set dns-server1 ${dhcp.dns1}\n        set dns-server2 ${dhcp.dns2}\n        config ip-range\n            edit 1\n                set start-ip ${dhcp.startIp}\n                set end-ip ${dhcp.endIp}\n            next\n        end\n    next\nend`,
    );
  }

  if (nat.mode === "vip") {
    configParts.push(
      `# ========== VIP / PORT FORWARD ==========\nconfig firewall vip\n    edit "${nat.name}"\n        set extintf "${nat.extintf}"\n        set extip ${nat.extIp}\n        set mappedip "${nat.mappedIp}"\n        set portforward enable\n        set protocol ${nat.protocol}\n        set extport ${nat.extPort}\n        set mappedport ${nat.mappedPort}\n    next\nend`,
    );
  }

  configParts.push(
    `# ========== FIREWALL POLICY ==========\nconfig firewall policy\n    edit 0\n        set name "${policy.name}"\n        set srcintf "${policy.srcintf}"\n        set dstintf "${policy.dstintf}"\n        set srcaddr "${policy.srcaddr}"\n        set dstaddr "${nat.mode === "vip" ? nat.name : policy.dstaddr}"\n        set action ${policy.action}\n        set schedule "${policy.schedule}"\n        set service "${policy.service}"\n        set logtraffic ${policy.logtraffic}\n        set nat ${policy.nat || nat.mode === "outbound" ? "enable" : "disable"}\n    next\nend`,
  );

  if (nat.mode === "outbound") {
    configParts.push(
      `# Outbound NAT ใช้ค่า set nat enable ใน Firewall Policy ด้านบน\n# หากต้องการ Central SNAT ให้เปิดใช้งานและสร้าง rule เพิ่มเติมตาม topology ของคุณ`,
    );
  }

  return configParts.join("\n\n");
}

export default function Home() {
  const [vlan, setVlan] = useState(defaultVlan);
  const [dhcp, setDhcp] = useState(defaultDhcp);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [nat, setNat] = useState(defaultNat);
  const [copyLabel, setCopyLabel] = useState("คัดลอก");

  const generatedConfig = useMemo(() => buildConfig(vlan, dhcp, policy, nat), [vlan, dhcp, policy, nat]);

  const updateVlan = (key: keyof Vlan) => (event: ChangeEvent<HTMLInputElement>) =>
    setVlan((current) => ({ ...current, [key]: event.target.value }));

  const updateDhcp = (key: keyof Dhcp) => (event: ChangeEvent<HTMLInputElement>) =>
    setDhcp((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const updatePolicy = (key: keyof FirewallPolicy) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPolicy((current) => ({
      ...current,
      [key]: event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const updateNat = (key: keyof NatRule) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNat((current) => ({ ...current, [key]: event.target.value }));

  const copyConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopyLabel("คัดลอกแล้ว ✓");
    window.setTimeout(() => setCopyLabel("คัดลอก"), 1800);
  };

  const exportConfig = () => {
    const blob = new Blob([generatedConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fortirule-${vlan.id || "config"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setVlan(defaultVlan);
    setDhcp(defaultDhcp);
    setPolicy(defaultPolicy);
    setNat(defaultNat);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#164e63_0%,#0f172a_35%,#020617_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-cyan-300/20 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-2xl shadow-lg shadow-red-950/40">▦</div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-[0.65rem] font-black uppercase tracking-[0.3em] text-cyan-100">FortiRule Builder</span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">Offline Config Generator</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">ตัวช่วยตั้งค่า FortiGate สำหรับงาน First Implement</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">Dashboard สำหรับ Network Engineer สร้างคอนฟิก VLAN, DHCP, Firewall Policy และ NAT แบบไม่เชื่อมต่ออุปกรณ์จริง</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetAll} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">รีเซ็ตทั้งหมด</button>
            <button type="button" onClick={copyConfig} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition hover:from-emerald-400 hover:to-green-500">สร้าง / คัดลอก CLI</button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {modules.map((module) => (
            <div key={module.label} className="rounded-2xl border border-cyan-300/15 bg-slate-950/55 p-4 shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/10">
              <div className="mb-3 text-2xl">{module.icon}</div>
              <p className="font-black text-white">{module.label}</p>
              <p className="mt-1 text-xs text-slate-400">{module.desc}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card title="WAN / LAN / VLAN" description="กำหนด Interface หลักของหน้างาน และสร้าง VLAN Interface สำหรับ FortiGate" badge="Core Network">
              <Field label="ชื่อ VLAN Interface" hint="เช่น VLAN10_USERS หรือ VLAN20_CLIENT">
                <input className={inputClass} value={vlan.name} onChange={updateVlan("name")} />
              </Field>
              <Field label="VLAN ID" hint="เช่น 10, 20, 30">
                <input className={inputClass} value={vlan.id} onChange={updateVlan("id")} />
              </Field>
              <Field label="Parent Interface" hint="Interface ที่ต่อไป Switch เช่น port2">
                <input className={inputClass} value={vlan.interface} onChange={updateVlan("interface")} />
              </Field>
              <Field label="IP Gateway" hint="IP ฝั่ง FortiGate ของ VLAN นี้">
                <input className={inputClass} value={vlan.ip} onChange={updateVlan("ip")} />
              </Field>
              <Field label="Subnet Mask">
                <input className={inputClass} value={vlan.mask} onChange={updateVlan("mask")} />
              </Field>
              <Field label="Allow Access" hint="เช่น ping https ssh">
                <input className={inputClass} value={vlan.allowAccess} onChange={updateVlan("allowAccess")} />
              </Field>
            </Card>

            <Card title="DHCP Server" description="กำหนดช่วงแจก IP ให้เครื่องลูกข่ายใน VLAN ที่เลือก" badge={dhcp.enabled ? "Enabled" : "Disabled"}>
              <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-slate-950/60 px-4 py-3 md:col-span-2">
                <input type="checkbox" checked={dhcp.enabled} onChange={updateDhcp("enabled")} className="h-5 w-5 accent-cyan-300" />
                <span className="font-bold text-slate-100">เปิดใช้งาน DHCP Server</span>
              </label>
              <Field label="Default Gateway">
                <input className={inputClass} value={dhcp.gateway} onChange={updateDhcp("gateway")} />
              </Field>
              <Field label="Netmask">
                <input className={inputClass} value={dhcp.netmask} onChange={updateDhcp("netmask")} />
              </Field>
              <Field label="Start IP">
                <input className={inputClass} value={dhcp.startIp} onChange={updateDhcp("startIp")} />
              </Field>
              <Field label="End IP">
                <input className={inputClass} value={dhcp.endIp} onChange={updateDhcp("endIp")} />
              </Field>
              <Field label="DNS 1">
                <input className={inputClass} value={dhcp.dns1} onChange={updateDhcp("dns1")} />
              </Field>
              <Field label="DNS 2">
                <input className={inputClass} value={dhcp.dns2} onChange={updateDhcp("dns2")} />
              </Field>
              <Field label="Lease Time (วินาที)">
                <input className={inputClass} value={dhcp.leaseTime} onChange={updateDhcp("leaseTime")} />
              </Field>
            </Card>

            <Card title="Firewall Policy / NAT" description="กำหนด Source, Destination, Service และ NAT สำหรับออก Internet หรือเปิดบริการ" badge="Traffic Rule">
              <Field label="ชื่อ Policy">
                <input className={inputClass} value={policy.name} onChange={updatePolicy("name")} />
              </Field>
              <Field label="Source Interface">
                <input className={inputClass} value={policy.srcintf} onChange={updatePolicy("srcintf")} />
              </Field>
              <Field label="Destination Interface">
                <input className={inputClass} value={policy.dstintf} onChange={updatePolicy("dstintf")} />
              </Field>
              <Field label="Service">
                <input className={inputClass} value={policy.service} onChange={updatePolicy("service")} />
              </Field>
              <Field label="Source Address">
                <input className={inputClass} value={policy.srcaddr} onChange={updatePolicy("srcaddr")} />
              </Field>
              <Field label="Destination Address">
                <input className={inputClass} value={policy.dstaddr} onChange={updatePolicy("dstaddr")} />
              </Field>
              <Field label="Action">
                <select className={inputClass} value={policy.action} onChange={updatePolicy("action")}>
                  <option value="accept">accept</option>
                  <option value="deny">deny</option>
                </select>
              </Field>
              <Field label="Log Traffic">
                <select className={inputClass} value={policy.logtraffic} onChange={updatePolicy("logtraffic")}>
                  <option value="all">all</option>
                  <option value="utm">utm</option>
                  <option value="disable">disable</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-slate-950/60 px-4 py-3 md:col-span-2">
                <input type="checkbox" checked={policy.nat} onChange={updatePolicy("nat")} className="h-5 w-5 accent-cyan-300" />
                <span className="font-bold text-slate-100">เปิด NAT ใน Firewall Policy</span>
              </label>
            </Card>

            <Card title="VIP / Port Forward" description="ใช้สำหรับ Publish Server จาก Internet เข้ามายัง IP ภายใน" badge={nat.mode === "vip" ? "VIP Mode" : "Outbound NAT"}>
              <Field label="ประเภท NAT">
                <select className={inputClass} value={nat.mode} onChange={updateNat("mode")}>
                  <option value="vip">VIP / Port Forward</option>
                  <option value="outbound">Outbound NAT</option>
                </select>
              </Field>
              <Field label="ชื่อ NAT / VIP">
                <input className={inputClass} value={nat.name} onChange={updateNat("name")} />
              </Field>
              <Field label="External Interface">
                <input className={inputClass} value={nat.extintf} onChange={updateNat("extintf")} />
              </Field>
              <Field label="External IP">
                <input className={inputClass} value={nat.extIp} onChange={updateNat("extIp")} />
              </Field>
              <Field label="Mapped Internal IP">
                <input className={inputClass} value={nat.mappedIp} onChange={updateNat("mappedIp")} />
              </Field>
              <Field label="Protocol">
                <select className={inputClass} value={nat.protocol} onChange={updateNat("protocol")}>
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </Field>
              <Field label="External Port">
                <input className={inputClass} value={nat.extPort} onChange={updateNat("extPort")} />
              </Field>
              <Field label="Mapped Port">
                <input className={inputClass} value={nat.mappedPort} onChange={updateNat("mappedPort")} />
              </Field>
            </Card>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[1.7rem] border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-slate-950/45 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-cyan-200">Summary</p>
                  <h2 className="text-2xl font-black text-white">ภาพรวม Config</h2>
                </div>
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">4 sections</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <StatusCard title="VLAN" value={`${vlan.name} / ID ${vlan.id}`} status="ok" />
                <StatusCard title="Gateway" value={`${vlan.ip} ${vlan.mask}`} status="ok" />
                <StatusCard title="DHCP Range" value={`${dhcp.startIp} - ${dhcp.endIp}`} status={dhcp.enabled ? "ok" : "off"} />
                <StatusCard title="Policy" value={`${policy.srcintf} → ${policy.dstintf}`} status="wait" />
                <StatusCard title="NAT" value={policy.nat ? "Enable ใน Policy" : "Disable"} status={policy.nat ? "ok" : "off"} />
                <StatusCard title="VPN" value="ยังไม่เปิด SSL VPN" status="off" />
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-slate-950/45 backdrop-blur">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-cyan-200">Network Topology</p>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3 text-center text-sm font-bold text-slate-100">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">Client<br /><span className="text-xs text-slate-400">{vlan.name}</span></div>
                <div className="text-cyan-200">→</div>
                <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4">FortiGate<br /><span className="text-xs text-slate-400">{vlan.interface}</span></div>
                <div className="text-cyan-200">→</div>
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4">Internet<br /><span className="text-xs text-slate-400">{policy.dstintf}</span></div>
              </div>
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                ⚠️ ตรวจสอบ Interface, IP, Route และ Policy ID อีกครั้งก่อนนำไปใช้กับอุปกรณ์จริง
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-cyan-300/15 bg-slate-950/85 p-5 shadow-2xl shadow-slate-950/45 backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-cyan-200">Terminal Output</p>
                  <h2 className="text-2xl font-black text-white">คอนฟิก CLI สำหรับ FortiGate</h2>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copyConfig} className="rounded-2xl bg-cyan-400/80 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-300">{copyLabel}</button>
                  <button type="button" onClick={exportConfig} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-black text-white transition hover:bg-white/10">ส่งออก .txt</button>
                </div>
              </div>
              <pre className="max-h-[58vh] overflow-auto rounded-2xl border border-cyan-300/10 bg-black/80 p-5 text-xs leading-6 text-cyan-50 shadow-inner sm:text-sm">
                <code>{generatedConfig}</code>
              </pre>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
