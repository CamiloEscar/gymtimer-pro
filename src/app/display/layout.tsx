import { DisplayHeader } from "@/components/layout/DisplayHeader";

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DisplayHeader />
      <main>{children}</main>
    </>
  );
}
