
import React, { useState } from 'react';
import { UserRole, TranslationMap } from '../../types';
import { SearchIcon, BrainIcon, BodyScanIcon, LungsIcon, InformationCircleIcon } from '../Icons';

interface ReferrerPortalProps {
  t: TranslationMap;
  role: UserRole;
}

const services = [
    { id: 'mri-brain', title: 'МРТ головного мозга', description: 'Высокоточное исследование для выявления паталогий.', price: 4000, Icon: BrainIcon },
    { id: 'ct-body', title: 'КТ органов брюшной полости', description: 'Компьютерная томография брюшной полости.', price: 3500, Icon: BodyScanIcon },
    { id: 'xray-chest', title: 'Рентген грудной клетки', description: 'Рентгенография органов грудной клетки.', price: 1500, Icon: LungsIcon },
];

type Service = typeof services[0];

const ReferrerPortal: React.FC<ReferrerPortalProps> = ({ t, role }) => {
    const [activeTab, setActiveTab] = useState('services');
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <div className="max-w-lg mx-auto bg-slate-100 p-4 relative pb-24">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Поиск услуг, врачей, клиник..."
                        className="w-full bg-white rounded-full py-3 pl-12 pr-4 text-gray-700 focus:outline-none shadow-sm"
                    />
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6 bg-slate-200 p-1 rounded-full">
                    <button onClick={() => setActiveTab('services')} className={`w-full py-2 rounded-full text-sm font-semibold ${activeTab === 'services' ? 'bg-white text-gray-800 shadow' : 'bg-transparent text-gray-500'}`}>Услуги</button>
                    <button onClick={() => setActiveTab('doctors')} className={`w-full py-2 rounded-full text-sm font-semibold ${activeTab === 'doctors' ? 'bg-white text-gray-800 shadow' : 'bg-transparent text-gray-500'}`}>Врачи</button>
                    <button onClick={() => setActiveTab('clinics')} className={`w-full py-2 rounded-full text-sm font-semibold ${activeTab === 'clinics' ? 'bg-white text-gray-800 shadow' : 'bg-transparent text-gray-500'}`}>Клиники</button>
                </div>

                {/* Service Cards */}
                <div className="space-y-4">
                    {services.map((service) => (
                        <div key={service.id} onClick={() => setSelectedService(service)} className="bg-white p-4 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
                                        <service.Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{service.title}</h3>
                                        <p className="text-sm text-gray-500">{service.description}</p>
                                    </div>
                                </div>
                                <InformationCircleIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-blue-600 font-semibold">от {service.price} Р</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">Сегодня</span>
                                    <span className="font-semibold text-blue-600">14:30</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Sheet */}
            {selectedService && (
                <>
                    <div onClick={() => setSelectedService(null)} className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"></div>
                    <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 z-50 transition-transform duration-300 ease-out ${selectedService ? 'translate-y-0' : 'translate-y-full'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold">{selectedService.title}</h2>
                            <InformationCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Рентгеноскопия органов грудной клетки в 2-х проекциях на содержание пухлинных новоутворений и других сторонних включений в ткани легких. Специфит для пациентов с подозрением на воспаление легких, которое продолжается свыше 2-3 часов до решения врача. Снимки выдаются на руки пациенту.
                        </p>
                        <h4 className="font-semibold text-sm mb-3">Свободное время очереди</h4>
                        <div className="flex justify-around space-x-2">
                            <div className="text-center p-3 border-2 border-blue-600 rounded-xl flex-1 cursor-pointer">
                                <p className="font-semibold text-blue-600">Сегодня</p>
                                <p className="text-xs text-blue-600">14:30</p>
                            </div>
                            <div className="text-center p-3 border border-gray-200 rounded-xl flex-1 cursor-pointer">
                                <p className="font-semibold text-gray-700">3 дня</p>
                                <p className="text-xs text-gray-500">12 слотов</p>
                            </div>
                            <div className="text-center p-3 border border-gray-200 rounded-xl flex-1 cursor-pointer">
                                <p className="font-semibold text-gray-700">7 дней</p>
                                <p className="text-xs text-gray-500">30+ слотов</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Sticky "Book Patient" button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-sm p-4 border-t border-gray-200">
                 <div className="max-w-lg mx-auto">
                    <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
                        ЗАПИСАТЬ ПАЦИЕНТА
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferrerPortal;
