import { Outlet } from "react-router";

export function MobileLayout() {
  return (
    <div className="min-h-screen bg-[#EBEBF0] flex justify-center">
      <div className="w-full max-w-3xl bg-[#F5F5F7] relative overflow-x-hidden flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}