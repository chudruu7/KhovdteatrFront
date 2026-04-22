import { useState, useEffect } from 'react';
import { Edit2, Info, Globe, Clock, MapPin, Phone, Mail } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import { cinemaAPI } from '../../api/adminAPI';

const CinemaInfoModule = () => {
  const [info, setInfo]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => { fetchCinemaInfo(); }, []);

  const fetchCinemaInfo = async () => {
    try {
      setLoading(true);
      const data = await cinemaAPI.getInfo();
      setInfo(data);
    } catch (error) {
      console.error('Мэдээлэл татахад алдаа гарлаа:', error);
      alert('Мэдээлэл татахад алдаа гарлаа: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await cinemaAPI.updateInfo(formData);
      alert('Мэдээлэл амжилттай шинэчлэгдлээ');
      setEditing(false);
      fetchCinemaInfo();
    } catch (error) {
      console.error('Мэдээлэл хадгалахад алдаа гарлаа:', error);
      alert('Мэдээлэл хадгалахад алдаа гарлаа: ' + error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  /* ---- Edit form ---- */
  if (editing) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Байгууллагын мэдээлэл засах</h2>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Нэр',  name: 'name',  type: 'text'  },
              { label: 'Утас', name: 'phone', type: 'text'  },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{f.label}</label>
                <input
                  type={f.type} name={f.name} defaultValue={info?.[f.name]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Хаяг</label>
            <input
              type="text" name="address" defaultValue={info?.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Имэйл',   name: 'email',   type: 'email' },
              { label: 'Вэбсайт', name: 'website', type: 'text'  },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{f.label}</label>
                <input
                  type={f.type} name={f.name} defaultValue={info?.[f.name]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button" onClick={() => setEditing(false)}
              className="px-5 py-2.5 text-slate-300 hover:bg-slate-700 rounded-xl"
            >
              Болих
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl"
            >
              Хадгалах
            </button>
          </div>
        </form>
      </div>
    );
  }

  /* ---- View mode ---- */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Байгууллагын мэдээлэл</h1>
        <button
          onClick={() => { setFormData(info); setEditing(true); }}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" /> Засах
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" /> Үндсэн мэдээлэл
          </h2>
          <div className="space-y-4">
            <Row label="Нэр"    value={info?.name} />
            <Row label="Хаяг"   value={info?.address} />
            <Row label="Утас"   value={info?.phone}   icon={<Phone className="w-4 h-4 text-slate-500" />} />
            <Row label="Имэйл"  value={info?.email}   icon={<Mail className="w-4 h-4 text-slate-500" />} />
            <Row label="Вэбсайт" value={info?.website} icon={<Globe className="w-4 h-4 text-slate-500" />} />
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" /> Сошиал медиа
          </h2>
          <div className="space-y-4">
            {info?.socialMedia && Object.entries(info.socialMedia).map(([key, value]) => (
              <Row key={key} label={key} value={value} />
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" /> Ажлын цаг
          </h2>
          <div className="space-y-3">
            {info?.workingHours && Object.entries(info.workingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between">
                <span className="text-slate-400 capitalize">{day}</span>
                <span className="text-white font-medium">{hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Halls */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" /> Танхимууд
          </h2>
          <div className="space-y-4">
            {info?.halls?.map((hall, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <div className="font-medium text-white">{hall.name}</div>
                  <div className="text-xs text-slate-400">{hall.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{hall.seats} суудал</div>
                  <div className="text-xs text-emerald-400">{hall.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Small helper */
const Row = ({ label, value, icon }) => (
  <div>
    <div className="text-sm text-slate-400 capitalize">{label}</div>
    <div className="text-white flex items-center gap-2">
      {icon}
      {value}
    </div>
  </div>
);

export default CinemaInfoModule;