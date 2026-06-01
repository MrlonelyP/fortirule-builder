"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

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

type Service = "ALL" | "HTTP" | "HTTPS" | "DNS" | "RDP" | "PING";
type Action = "ACCEPT" | "DENY";
type NatMode = "AUTO" | "ENABLE" | "DISABLE";

type VlanDraft = Omit<Vlan, "uid">;
type PolicyDraft = Omit<PolicyRule, "uid">;

const internetDestination = "internet";
const wanInterface = "wan1";
const allowAccess = "ping https ssh";
const leaseTime = "86400";
const dnsServers = ["8.8.8.8", "1.1.1.1"];
const services: Service[] = ["ALL", "HTTP", "HTTPS", "DNS", "RDP", "PING"];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-2 block text-sm font-medium text-slate-200";
const buttonClass = "rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

const starterVlans: Vlan[] = [
  {
    uid: "vlan-10",
    name: "VLAN10_USERS",
    vlanId: "10",
    interfaceName: "port2",
    gatewayIp: "192.168.10.1",
    subnetMask: "255.255.255.0",
    dhcpStartIp: "192.168.10.100",
    dhcpEndIp: "192.168.10.200",
    allowInternet: true,
  },
  {
    uid: "vlan-20",
    name: "VLAN20_SERVERS",
    vlanId: "20",
    interfaceName: "port2",
    gatewayIp: "192.168.20.1",
    subnetMask: "255.255.255.0",
    dhcpStartIp: "192.168.20.100",
    dhcpEndIp: "192.168.20.150",
    allowInternet: false,
  },
];

const starterPolicies: PolicyRule[] = [
  {
    uid: "policy-users-internet",
    name: "ผู้ใช้งานออกอินเทอร์เน็ต",
    sourceVlanUid: "vlan-10",
    destination: internetDestination,
    service: "ALL",
    action: "ACCEPT",
    nat: "AUTO",
  },
  {
    uid: "policy-users-servers",
    name: "ผู้ใช้งานไปหาเซิร์ฟเวอร์",
    sourceVlanUid: "vlan-10",
    destination: "vlan-20",
    service: "HTTPS",
    action: "ACCEPT",
    nat: "AUTO",
  },
];

const emptyVlanDraft: VlanDraft = {
  name: "VLAN30_GUEST",
  vlanId: "30",
  interfaceName: "port2",
  gatewayIp: "192.168.30.1",
  subnetMask: "255.255.255.0",
  dhcpStartIp: "192.168.30.100",
  dhcpEndIp: "192.168.30.200",
  allowInternet: true,
};

const emptyPolicyDraft: PolicyDraft = {
  name: "นโยบายใหม่",
  sourceVlanUid: "vlan-10",
  destination: internetDestination,
  service: "ALL",
  action: "ACCEPT",
  nat: "AUTO",
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {children}
    </section>
  );
}

function makeUid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getVlanName(vlan?: Vlan) {
  if (!vlan) return "ไม่พบ VLAN";
  return vlan.name.trim() || `VLAN${vlan.vlanId}`;
}

function getDestinationName(destination: string, vlans: Vlan[]) {
  if (destination === internetDestination) return "อินเทอร์เน็ต";
  return getVlanName(vlans.find((vlan) => vlan.uid === destination));
}

function getEffectiveNat(policy: PolicyRule | PolicyDraft) {
  if (policy.nat === "ENABLE") return "enable";
  if (policy.nat === "DISABLE") return "disable";
  return policy.destination === internetDestination ? "enable" : "disable";
}

function explainPolicy(policy: PolicyRule, index: number, vlans: Vlan[]) {
  const source = getVlanName(vlans.find((vlan) => vlan.uid === policy.sourceVlanUid));
  const destination = getDestinationName(policy.destination, vlans);
  const natText = getEffectiveNat(policy) === "enable" ? "เปิด NAT" : "ปิด NAT";
  const actionText = policy.action === "ACCEPT" ? "อนุญาต" : "ปฏิเสธ";

  return `# นโยบาย ${index}: ${policy.name}\n# คำอธิบาย: ${actionText} ทราฟฟิกจาก ${source} ไปยัง ${destination} เฉพาะบริการ ${policy.service} และ ${natText}`;
}

function buildConfig(vlans: Vlan[], policies: PolicyRule[]) {
  const configParts = [
    `# FortiRule Builder - Generated FortiGate CLI\n# เว็บนี้เป็นหน้าเว็บฝั่งผู้ใช้เท่านั้น ไม่ได้เชื่อมต่อ FortiGate จริง\n# ตรวจสอบชื่อพอร์ต, IP, VLAN ID และลำดับนโยบายก่อนนำไปใช้งานจริง`,
  ];

  if (vlans.length === 0) {
    configParts.push("# ยังไม่มี VLAN กรุณาเพิ่ม VLAN ก่อนสร้างคอนฟิก");
  }

  vlans.forEach((vlan) => {
    const vlanName = getVlanName(vlan);
    configParts.push(
      `config system interface\n    edit "${vlanName}"\n        set vdom "root"\n        set interface "${vlan.interfaceName}"\n        set vlanid ${vlan.vlanId}\n        set ip ${vlan.gatewayIp} ${vlan.subnetMask}\n        set allowaccess ${allowAccess}\n    next\nend`,
    );

    configParts.push(
      `config system dhcp server\n    edit 0\n        set interface "${vlanName}"\n        set default-gateway ${vlan.gatewayIp}\n        set netmask ${vlan.subnetMask}\n        set lease-time ${leaseTime}\n        set dns-service specify\n        set dns-server1 ${dnsServers[0]}\n        set dns-server2 ${dnsServers[1]}\n        config ip-range\n            edit 1\n                set start-ip ${vlan.dhcpStartIp}\n                set end-ip ${vlan.dhcpEndIp}\n            next\n        end\n    next\nend`,
    );
  });

  const allowedPolicies = policies.filter((policy) => {
    const sourceExists = vlans.some((vlan) => vlan.uid === policy.sourceVlanUid);
    const destinationExists = policy.destination === internetDestination || vlans.some((vlan) => vlan.uid === policy.destination);
    return sourceExists && destinationExists;
  });

  const explicitInternetSources = new Set(
    allowedPolicies
      .filter((policy) => policy.destination === internetDestination)
      .map((policy) => policy.sourceVlanUid),
  );
  const autoInternetPolicies: PolicyRule[] = vlans
    .filter((vlan) => vlan.allowInternet && !explicitInternetSources.has(vlan.uid))
    .map((vlan) => ({
      uid: `auto-internet-${vlan.uid}`,
      name: `ออกอินเทอร์เน็ตอัตโนมัติ-${getVlanName(vlan)}`,
      sourceVlanUid: vlan.uid,
      destination: internetDestination,
      service: "ALL",
      action: "ACCEPT",
      nat: "ENABLE",
    }));
  const policiesForCli = [...allowedPolicies, ...autoInternetPolicies];

  if (policiesForCli.length === 0) {
    configParts.push("# ยังไม่มีนโยบาย Firewall ที่พร้อมสร้าง CLI");
  }

  policiesForCli.forEach((policy, index) => {
    const source = vlans.find((vlan) => vlan.uid === policy.sourceVlanUid);
    const destination = vlans.find((vlan) => vlan.uid === policy.destination);
    const destinationInterface = policy.destination === internetDestination ? wanInterface : getVlanName(destination);

    configParts.push(
      `${explainPolicy(policy, index + 1, vlans)}\nconfig firewall policy\n    edit 0\n        set name "${policy.name}"\n        set srcintf "${getVlanName(source)}"\n        set dstintf "${destinationInterface}"\n        set srcaddr "all"\n        set dstaddr "all"\n        set action ${policy.action.toLowerCase()}\n        set schedule "always"\n        set service "${policy.service}"\n        set logtraffic all\n        set nat ${getEffectiveNat(policy)}\n    next\nend`,
    );
  });

  return configParts.join("\n\n");
}

export default function Home() {
  const [vlans, setVlans] = useState<Vlan[]>(starterVlans);
  const [policies, setPolicies] = useState<PolicyRule[]>(starterPolicies);
  const [vlanDraft, setVlanDraft] = useState<VlanDraft>(emptyVlanDraft);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(emptyPolicyDraft);
  const [copyLabel, setCopyLabel] = useState("คัดลอก CLI");

  const generatedConfig = useMemo(() => buildConfig(vlans, policies), [vlans, policies]);

  const updateVlanDraft = (key: keyof VlanDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setVlanDraft((current) => ({ ...current, [key]: key === "allowInternet" ? value === "yes" : value }));
  };

  const updatePolicyDraft = (key: keyof PolicyDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setPolicyDraft((current) => ({ ...current, [key]: value }));
  };

  const addVlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newVlan: Vlan = { ...vlanDraft, uid: makeUid("vlan") };
    setVlans((current) => [...current, newVlan]);
    setVlanDraft({ ...emptyVlanDraft, vlanId: String(Number(vlanDraft.vlanId || 30) + 10) });
    setPolicyDraft((current) => ({ ...current, sourceVlanUid: current.sourceVlanUid || newVlan.uid }));
  };

  const deleteVlan = (uid: string) => {
    const remainingVlans = vlans.filter((vlan) => vlan.uid !== uid);
    setVlans(remainingVlans);
    setPolicies((current) => current.filter((policy) => policy.sourceVlanUid !== uid && policy.destination !== uid));
    setPolicyDraft((current) => ({
      ...current,
      sourceVlanUid: current.sourceVlanUid === uid ? remainingVlans[0]?.uid || "" : current.sourceVlanUid,
      destination: current.destination === uid ? internetDestination : current.destination,
    }));
  };

  const addPolicy = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPolicies((current) => [...current, { ...policyDraft, uid: makeUid("policy") }]);
    setPolicyDraft((current) => ({ ...current, name: "นโยบายใหม่" }));
  };

  const deletePolicy = (uid: string) => {
    setPolicies((current) => current.filter((policy) => policy.uid !== uid));
  };

  const copyConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopyLabel("คัดลอกแล้ว ✓");
    window.setTimeout(() => setCopyLabel("คัดลอก CLI"), 1800);
  };

  const exportConfig = () => {
    const blob = new Blob([generatedConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fortirule-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-slate-950/60 p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                เครื่องมือสร้าง CLI • ไม่มีฐานข้อมูล • ไม่เชื่อมต่อ FortiGate จริง
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">FortiRule Builder</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                สร้างคอนฟิก FortiGate สำหรับหลาย VLAN, DHCP และนโยบาย Firewall ได้ง่าย ๆ ผ่านหน้าเว็บภาษาไทย เหมาะสำหรับผู้เริ่มต้น
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:min-w-[32rem]">
              {["หลาย VLAN", "DHCP", "นโยบาย", "ส่งออกไฟล์"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="text-2xl font-black text-cyan-200">✓</div>
                  <div className="text-sm font-semibold text-slate-200">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card title="เพิ่ม VLAN หลายรายการ" description="กรอกข้อมูล VLAN ทีละรายการ ระบบจะแสดงรายการทั้งหมดในตารางและสร้าง DHCP ให้ทุก VLAN อัตโนมัติ">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={addVlan}>
                <Field label="ชื่อ VLAN">
                  <input className={inputClass} value={vlanDraft.name} onChange={updateVlanDraft("name")} required />
                </Field>
                <Field label="หมายเลข VLAN ID">
                  <input className={inputClass} value={vlanDraft.vlanId} onChange={updateVlanDraft("vlanId")} required />
                </Field>
                <Field label="พอร์ตแม่">
                  <input className={inputClass} value={vlanDraft.interfaceName} onChange={updateVlanDraft("interfaceName")} required />
                </Field>
                <Field label="ที่อยู่เกตเวย์">
                  <input className={inputClass} value={vlanDraft.gatewayIp} onChange={updateVlanDraft("gatewayIp")} required />
                </Field>
                <Field label="มาสก์เครือข่าย">
                  <input className={inputClass} value={vlanDraft.subnetMask} onChange={updateVlanDraft("subnetMask")} required />
                </Field>
                <Field label="IP เริ่มต้นของ DHCP">
                  <input className={inputClass} value={vlanDraft.dhcpStartIp} onChange={updateVlanDraft("dhcpStartIp")} required />
                </Field>
                <Field label="IP สิ้นสุดของ DHCP">
                  <input className={inputClass} value={vlanDraft.dhcpEndIp} onChange={updateVlanDraft("dhcpEndIp")} required />
                </Field>
                <Field label="อนุญาตออกอินเทอร์เน็ต">
                  <select className={inputClass} value={vlanDraft.allowInternet ? "yes" : "no"} onChange={updateVlanDraft("allowInternet")}>
                    <option value="yes">ใช่</option>
                    <option value="no">ไม่ใช่</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <button className={`${buttonClass} bg-cyan-300 text-slate-950 hover:bg-cyan-200`} type="submit">
                    เพิ่ม VLAN ลงตาราง
                  </button>
                </div>
              </form>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-200">
                    <tr>
                      <th className="px-4 py-3">ชื่อ VLAN</th>
                      <th className="px-4 py-3">VLAN ID</th>
                      <th className="px-4 py-3">พอร์ตแม่</th>
                      <th className="px-4 py-3">เกตเวย์</th>
                      <th className="px-4 py-3">ช่วง IP ของ DHCP</th>
                      <th className="px-4 py-3">ออกเน็ต</th>
                      <th className="px-4 py-3">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-slate-950/40 text-slate-100">
                    {vlans.map((vlan) => (
                      <tr key={vlan.uid}>
                        <td className="px-4 py-3 font-semibold">{getVlanName(vlan)}</td>
                        <td className="px-4 py-3">{vlan.vlanId}</td>
                        <td className="px-4 py-3">{vlan.interfaceName}</td>
                        <td className="px-4 py-3">{vlan.gatewayIp}</td>
                        <td className="px-4 py-3">{vlan.dhcpStartIp} - {vlan.dhcpEndIp}</td>
                        <td className="px-4 py-3">{vlan.allowInternet ? "ใช่" : "ไม่ใช่"}</td>
                        <td className="px-4 py-3">
                          <button className="rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/20" onClick={() => deleteVlan(vlan.uid)} type="button">
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vlans.length === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-center text-slate-400" colSpan={7}>ยังไม่มี VLAN ในตาราง</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="สร้างนโยบายหลายรายการ" description="เลือก VLAN ต้นทาง ปลายทางเป็น VLAN ภายในหรืออินเทอร์เน็ต แล้วกำหนดบริการ การกระทำ และ NAT แบบเข้าใจง่าย">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={addPolicy}>
                <Field label="ชื่อนโยบาย">
                  <input className={inputClass} value={policyDraft.name} onChange={updatePolicyDraft("name")} required />
                </Field>
                <Field label="VLAN ต้นทาง">
                  <select className={inputClass} value={policyDraft.sourceVlanUid} onChange={updatePolicyDraft("sourceVlanUid")} required>
                    {vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}
                  </select>
                </Field>
                <Field label="ปลายทาง">
                  <select className={inputClass} value={policyDraft.destination} onChange={updatePolicyDraft("destination")} required>
                    <option value={internetDestination}>อินเทอร์เน็ต</option>
                    {vlans.map((vlan) => <option key={vlan.uid} value={vlan.uid}>{getVlanName(vlan)}</option>)}
                  </select>
                </Field>
                <Field label="บริการ">
                  <select className={inputClass} value={policyDraft.service} onChange={updatePolicyDraft("service")}>
                    {services.map((service) => <option key={service} value={service}>{service}</option>)}
                  </select>
                </Field>
                <Field label="การกระทำ">
                  <select className={inputClass} value={policyDraft.action} onChange={updatePolicyDraft("action")}>
                    <option value="ACCEPT">อนุญาต (ACCEPT)</option>
                    <option value="DENY">ปฏิเสธ (DENY)</option>
                  </select>
                </Field>
                <Field
                  label="สถานะ NAT"
                  hint={`โหมดอัตโนมัติจะ${policyDraft.destination === internetDestination ? "เปิด NAT เมื่อปลายทางเป็นอินเทอร์เน็ต" : "ปิด NAT เมื่อปลายทางเป็น VLAN ภายใน"}`}
                >
                  <select className={inputClass} value={policyDraft.nat} onChange={updatePolicyDraft("nat")}>
                    <option value="AUTO">อัตโนมัติ</option>
                    <option value="ENABLE">เปิด</option>
                    <option value="DISABLE">ปิด</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <button className={`${buttonClass} bg-emerald-300 text-slate-950 hover:bg-emerald-200`} disabled={vlans.length === 0} type="submit">
                    เพิ่มนโยบายลงตาราง
                  </button>
                </div>
              </form>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-slate-950/80 text-slate-200">
                    <tr>
                      <th className="px-4 py-3">ชื่อนโยบาย</th>
                      <th className="px-4 py-3">ต้นทาง</th>
                      <th className="px-4 py-3">ปลายทาง</th>
                      <th className="px-4 py-3">บริการ</th>
                      <th className="px-4 py-3">การกระทำ</th>
                      <th className="px-4 py-3">NAT ที่ใช้จริง</th>
                      <th className="px-4 py-3">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-slate-950/40 text-slate-100">
                    {policies.map((policy) => (
                      <tr key={policy.uid}>
                        <td className="px-4 py-3 font-semibold">{policy.name}</td>
                        <td className="px-4 py-3">{getVlanName(vlans.find((vlan) => vlan.uid === policy.sourceVlanUid))}</td>
                        <td className="px-4 py-3">{getDestinationName(policy.destination, vlans)}</td>
                        <td className="px-4 py-3">{policy.service}</td>
                        <td className="px-4 py-3">{policy.action === "ACCEPT" ? "อนุญาต" : "ปฏิเสธ"}</td>
                        <td className="px-4 py-3">{getEffectiveNat(policy) === "enable" ? "เปิด" : "ปิด"}</td>
                        <td className="px-4 py-3">
                          <button className="rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-500/20" onClick={() => deletePolicy(policy.uid)} type="button">
                            ลบ
                          </button>
                        </td>
                      </tr>
                    ))}
                    {policies.length === 0 ? (
                      <tr>
                        <td className="px-4 py-5 text-center text-slate-400" colSpan={7}>ยังไม่มีนโยบายในตาราง</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-3xl border border-cyan-200/20 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">คอนฟิก CLI สำหรับ FortiGate</h2>
                  <p className="text-sm text-slate-400">ผลลัพธ์อัปเดตทันทีจาก VLAN และนโยบายในตาราง</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyConfig}
                    className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    {copyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={exportConfig}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    ส่งออก .txt
                  </button>
                </div>
              </div>
              <pre className="max-h-[75vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 p-5 text-sm leading-6 text-cyan-50 shadow-inner">
                <code>{generatedConfig}</code>
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
