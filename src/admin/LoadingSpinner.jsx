import { Loader } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
      <p className="text-slate-400">Түр хүлээнэ үү...</p>
    </div>
  </div>
);

export default LoadingSpinner;