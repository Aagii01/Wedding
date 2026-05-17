import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner theme="light" richColors position="top-center" {...props} />
);

export { Toaster };
