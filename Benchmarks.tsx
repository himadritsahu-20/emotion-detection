export default function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-void" />
      <div className="micro-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />
      <div className="absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-cyan/[0.05] blur-[120px]" />
      <div className="absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-mint/[0.05] blur-[120px]" />
      <div className="scanlines absolute inset-0" />
      <div className="scan-sweep" />
    </div>
  );
}
