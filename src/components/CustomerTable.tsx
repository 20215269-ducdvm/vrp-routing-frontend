import { Location } from '../types/types';
import { Edit3, Navigation, Trash2 } from 'lucide-react';

interface CustomerTableProps {
    customers: Location[];
    problemType: string;
    handleLocationEdit?: (location: Location) => void;
    handleLocationDelete?: (locationId: string | number) => void;
    updateMapCenter?: (location: Location) => void;
}

export default function CustomerTable({ 
    customers, 
    problemType,
    handleLocationEdit,
    handleLocationDelete,
    updateMapCenter
}: CustomerTableProps) {
    return (
        <div className="bg-white rounded-lg border p-4 mt-4">
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="px-4 py-2">ID</th>
                        <th className="px-4 py-2">Tên</th>
                        <th className="px-4 py-2">Vị trí</th>
                        <th className="px-4 py-2">Nhu cầu</th>
                        {problemType === 'VRPTW' && <th className="px-4 py-2">Khung giờ</th>}
                        {(handleLocationEdit || handleLocationDelete || updateMapCenter) && (
                            <th className="px-4 py-2">Thao tác</th>
                        )}
                    </tr>
                    </thead>
                    <tbody>
                    {customers.map((cust, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">{cust.id}</td>
                            <td className="px-4 py-2">{cust.name}</td>
                            <td className="px-4 py-2">({cust.lat.toFixed(4)}, {cust.lon.toFixed(4)})</td>
                            <td className="px-4 py-2">{cust.demand}</td>
                            {problemType === 'VRPTW' && (
                                <td className="px-4 py-2">
                                    {cust.timeWindow ? `${cust.timeWindow[0]}:00 - ${cust.timeWindow[1]}:00` : 'N/A'}
                                </td>
                            )}
                            {(handleLocationEdit || handleLocationDelete || updateMapCenter) && (
                                <td className="px-4 py-2">
                                    <div className="flex gap-1">
                                        {updateMapCenter && (
                                            <button
                                                onClick={() => updateMapCenter(cust)}
                                                className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                                title="Xem trên bản đồ"
                                            >
                                                <Navigation size={12} />
                                            </button>
                                        )}
                                        {handleLocationEdit && (
                                            <button
                                                onClick={() => handleLocationEdit(cust)}
                                                className="p-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit3 size={12} />
                                            </button>
                                        )}
                                        {handleLocationDelete && (
                                            <button
                                                onClick={() => handleLocationDelete(cust.id)}
                                                className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                title="Xóa"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}