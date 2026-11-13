export default function Footer() {
  return (
    <footer className="bg-[var(--footer)] text-white">
      <div className="py-5 text-center text-[13px] tracking-wide text-white/80">
        Copyright © {new Date().getFullYear()}, Bookstore Private Limited. All Rights Reserved
      </div>
    </footer>
  );
}
