import React, { useEffect, useState } from 'react';
import { getReports, deleteReport } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Calendar, ChevronRight } from 'lucide-react';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await getReports();
            // Assuming data is an array or has a property 'reports'
            setReports(Array.isArray(data) ? data : data.reports || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await deleteReport(id);
                setReports(reports.filter((r) => r.id !== id && r._id !== id));
            } catch (error) {
                console.error('Failed to delete report:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Create New Report
                    </button>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
                        <p className="text-gray-500 mb-6">Generate your first medical report to see it here.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map((report) => (
                            <div
                                key={report.id || report._id}
                                onClick={() => navigate(`/reports/${report.id || report._id}`)}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, report.id || report._id)}
                                        className="text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {report.title || 'Untitled Report'}
                                </h3>

                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                    {report.summary || report.description || 'No summary available for this report.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(report.createdAt || report.timestamp || Date.now()).toLocaleDateString()}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
