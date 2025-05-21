// src/app/(authenticated)/cleaning-setup/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Spinner } from '@/components/spinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/lib/api';
import axios from 'axios';
import { Zone, CleaningType, ChecklistTemplate } from '@/lib/types';
import { Plus } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmationModal from '@/components/ConfirmationModal';
import ZoneForm from '@/components/forms/ZoneForm';
import CleaningTypeForm from '@/components/forms/CleaningTypeFrom';
import ChecklistTemplateForm from '@/components/forms/ChecklistTemplateForm';


export default function CleaningSetupPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [cleaningTypes, setCleaningTypes] = useState<CleaningType[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для управления зонами
  const [isZoneFormOpen, setIsZoneFormOpen] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState<Zone | undefined>(undefined);


  const [isZoneConfirmModalOpen, setIsZoneConfirmModalOpen] = useState(false);
  const [zoneToDeleteId, setZoneToDeleteId] = useState<number | null>(null);
  const [zoneToDeleteName, setZoneToDeleteName] = useState<string | null>(null);


  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);


  // Состояния для управления типами уборок
  const [isCleaningTypeFormOpen, setIsCleaningTypeFormOpen] = useState(false);
  const [cleaningTypeToEdit, setCleaningTypeToEdit] = useState<CleaningType | undefined>(undefined);

  const [isCleaningTypeConfirmModalOpen, setIsCleaningTypeConfirmModalOpen] = useState(false);
  const [cleaningTypeToDeleteId, setCleaningTypeToDeleteId] = useState<number | null>(null);
  const [cleaningTypeToDeleteName, setCleaningTypeToDeleteName] = useState<string | null>(null);

  const [deletingCleaningTypeId, setDeletingCleaningTypeId] = useState<number | null>(null);

  // --- Состояния для управления шаблонами чек-листов ---
  const [isChecklistTemplateFormOpen, setIsChecklistTemplateFormOpen] = useState(false);
  const [checklistTemplateToEdit, setChecklistTemplateToEdit] = useState<ChecklistTemplate | undefined>(undefined);

  const [isChecklistTemplateConfirmModalOpen, setIsChecklistTemplateConfirmModalOpen] = useState(false);
  const [checklistTemplateToDeleteId, setChecklistTemplateToDeleteId] = useState<number | null>(null);
  const [checklistTemplateToDeleteName, setChecklistTemplateToDeleteName] = useState<string | null>(null);

  const [deletingChecklistTemplateId, setDeletingChecklistTemplateId] = useState<number | null>(null);

  const fetchZones = useCallback(async () => {
      setError(null); 
      setIsLoadingData(true); 
      try {
          const response = await api.get<Zone[]>('/api/zones/', {
                params: {
                    all :true
                }
            });

          if (response.status === 200) {
              setZones(response.data);
              console.log("Zones fetched successfully:", response.data);
          } else {
              setError('Не удалось загрузить список зон. Статус: ' + response.status);
              console.error("Failed to fetch zones. Status:", response.status);
          }
      } catch (err) {
          console.error('Error fetching zones:', err);
          if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке списка зон.');
          } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при загрузке списка зон.');
          } else {
                setError('Произошла непредвиденная ошибка при загрузке списка зон.');
          }
      } 
  }, []);

   const fetchCleaningTypes = useCallback(async () => {
       
       try {
           const response = await api.get<CleaningType[]>('/api/cleaningtypes/', {
                params: {
                    all :true
                }
            });

           if (response.status === 200) {
               setCleaningTypes(response.data);
               console.log("Cleaning types fetched successfully:", response.data);
           } else {
               setError('Не удалось загрузить типы уборок. Статус: ' + response.status);
               console.error("Failed to fetch cleaning types. Status:", response.status);
           }
       } catch (err) {
           console.error('Error fetching cleaning types:', err);
           if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке типов уборок.');
           } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при загрузке типов уборок.');
           } else {
               setError('Произошла непредвиденная ошибка при загрузке типов уборок.');
           }
       }
 
   }, []);


    const fetchChecklistTemplates = useCallback(async () => {
        try {
           
            const response = await api.get<ChecklistTemplate[]>('/api/checklisttemplates/', {
                params: {
                    all :true
                }
            }); 
            if (response.status === 200) {
                setChecklistTemplates(response.data);
                console.log("Checklist templates fetched successfully:", response.data);
            } else {
                setError('Не удалось загрузить шаблоны чек-листов. Статус: ' + response.status);
                console.error("Failed to fetch checklist templates. Status:", response.status);
            }
        } catch (err) {
            console.error('Error fetching checklist templates:', err);
            if (axios.isAxiosError(err) && err.response) {
                 setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при загрузке шаблонов чек-листов.');
            } else if (axios.isAxiosError(err) && err.request) {
                 setError('Нет ответа от сервера при загрузке шаблонов чек-листов.');
            } else {
                setError('Произошла непредвиденная ошибка при загрузке шаблонов чек-листов.');
            }
        }
    }, []);



  useEffect(() => {
    
    if (!isAuthLoading) {
    
      if (user?.role === 'manager') {
        setIsLoadingData(true);
        setError(null);
        fetchZones(); 
        Promise.all([fetchZones(), fetchCleaningTypes(), fetchChecklistTemplates()]) 
            .catch(err => {
                console.error("Error during parallel data fetching:", err);
            })
            .finally(() => {
                setIsLoadingData(false); 
            });
      } else {
      
        setIsLoadingData(false);
        setError('У вас нет прав для просмотра этой страницы. Доступно только менеджерам.');
      }
    }
  }, [user, isAuthLoading, fetchZones,fetchCleaningTypes, fetchChecklistTemplates]);


  // --- Обработчики для форм создания/редактирования зоны ---

  const handleCreateZone = () => {
      
      if (deletingZoneId !== null || isZoneConfirmModalOpen) return;
      setIsZoneFormOpen(true);
      setZoneToEdit(undefined);
  };

  const handleEditZone = (zone: Zone) => {
        
      if (deletingZoneId !== null || isZoneConfirmModalOpen) return;
      setIsZoneFormOpen(true);
      setZoneToEdit(zone); 
  };


    const handleZoneFormSuccess = () => {
        setIsZoneFormOpen(false); 
        setZoneToEdit(undefined); 
        fetchZones(); 
    };

    
    const handleZoneFormCancel = () => {
        setIsZoneFormOpen(false); 
        setZoneToEdit(undefined); 
        
    };


  // --- Обработчики для удаления зоны ---

  const handleDeleteZoneClick = (zoneId: number, zoneName: string) => {
      
      if (deletingZoneId !== null || isZoneFormOpen) return;
      setIsZoneConfirmModalOpen(true);
      setZoneToDeleteId(zoneId);
      setZoneToDeleteName(zoneName);
      setError(null);
  };

  const handleDeleteZoneConfirm = async () => {
      if (zoneToDeleteId === null) return;

      setDeletingZoneId(zoneToDeleteId); 
      try {
          
          const response = await api.delete(`/api/zones/${zoneToDeleteId}/`); 

          if (response.status === 204) { 
              console.log(`Зона "${zoneToDeleteName}" успешно удалена.`);
              fetchZones(); 
          } else {
                setError('Не удалось удалить зону. Статус: ' + response.status);
                console.error("Failed to delete zone. Status:", response.status);
          }

      } catch (err) {
          console.error(`Error deleting zone with ID ${zoneToDeleteId}:`, err);
          if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении зоны.');
          } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при удалении зоны. Проверьте подключение.');
          } else {
              setError('Произошла непредвиденная ошибка при удалении зоны.');
          }
      } finally {
          setDeletingZoneId(null); 
          setZoneToDeleteId(null); 
          setZoneToDeleteName(null); 
          setIsZoneConfirmModalOpen(false); 
      }
  };

  const handleDeletingZoneCancel = () => {
      setIsZoneConfirmModalOpen(false); 
      setZoneToDeleteId(null); 
      setZoneToDeleteName(null); 
    
  };


  // --- Обработчики для форм создания/редактирования типа уборки ---

  const handleCreateCleaningType = () => {
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeConfirmModalOpen || isZoneFormOpen) return;
      setIsCleaningTypeFormOpen(true);
      setCleaningTypeToEdit(undefined); // undefined для режима создания
  };

  const handleEditCleaningType = (cleaningType: CleaningType) => {
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeConfirmModalOpen || isZoneFormOpen) return;
      setIsCleaningTypeFormOpen(true);
      setCleaningTypeToEdit(cleaningType); 
  };

   // Функция, вызываемая при успешном создании или редактировании типа уборки
   const handleCleaningTypeFormSuccess = () => {
       setIsCleaningTypeFormOpen(false); 
       setCleaningTypeToEdit(undefined); 
       fetchCleaningTypes(); 
       // TODO: Возможно, нужно обновить список шаблонов чек-листов, если они связаны с типами уборок
   };

   // Функция, вызываемая при отмене или закрытии формы
   const handleCleaningTypeFormCancel = () => {
       setIsCleaningTypeFormOpen(false); 
       setCleaningTypeToEdit(undefined); 
      
   };

  // --- Обработчики для удаления типа уборки ---

  const handleDeleteCleaningTypeClick = (cleaningTypeId: number, cleaningTypeName: string) => {
      
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeFormOpen || isZoneFormOpen) return;
      setIsCleaningTypeConfirmModalOpen(true);
      setCleaningTypeToDeleteId(cleaningTypeId);
      setCleaningTypeToDeleteName(cleaningTypeName);
      setError(null); 
  };

  const handleDeleteCleaningTypeConfirm = async () => {
      if (cleaningTypeToDeleteId === null) return;

      setDeletingCleaningTypeId(cleaningTypeToDeleteId); 

      try {
          
          const response = await api.delete(`/api/cleaningtypes/${cleaningTypeToDeleteId}/`); 

          if (response.status === 204) { 
              console.log(`Тип уборки "${cleaningTypeToDeleteName}" успешно удален.`);
              fetchCleaningTypes(); 
              // TODO: Возможно, нужно обновить список шаблонов чек-листов, если они связаны с типами уборок
          } else {
               setError('Не удалось удалить тип уборки. Статус: ' + response.status);
               console.error("Failed to delete cleaning type. Status:", response.status);
          }

      } catch (err) {
          console.error(`Error deleting cleaning type with ID ${cleaningTypeToDeleteId}:`, err);
          if (axios.isAxiosError(err) && err.response) {
               setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении типа уборки.');
          } else if (axios.isAxiosError(err) && err.request) {
               setError('Нет ответа от сервера при удалении типа уборки. Проверьте подключение.');
          } else {
              setError('Произошла непредвиденная ошибка при удалении типа уборки.');
          }
      } finally {
          setDeletingCleaningTypeId(null); 
          setCleaningTypeToDeleteId(null); 
          setCleaningTypeToDeleteName(null); 
          setIsCleaningTypeConfirmModalOpen(false); 
      }
  };

  const handleDeletingCleaningTypeCancel = () => {
      setIsCleaningTypeConfirmModalOpen(false); // Закрываем модальное окно подтверждения
      setCleaningTypeToDeleteId(null); // Сбрасываем ID типа уборки для удаления
      setCleaningTypeToDeleteName(null); // Сбрасываем имя типа уборки для удаления
      // Не сбрасываем deletingCleaningTypeId, если удаление уже началось
  };

  // --- Обработчики для форм создания/редактирования шаблона чек-листа ---

  const handleCreateChecklistTemplate = () => {
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeConfirmModalOpen || isZoneFormOpen || isCleaningTypeFormOpen || deletingChecklistTemplateId !== null || isChecklistTemplateConfirmModalOpen) return;
      setIsChecklistTemplateFormOpen(true);
      setChecklistTemplateToEdit(undefined); 
  };

  const handleEditChecklistTemplate = (checklistTemplate: ChecklistTemplate) => {
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeConfirmModalOpen || isZoneFormOpen || isCleaningTypeFormOpen || deletingChecklistTemplateId !== null || isChecklistTemplateConfirmModalOpen) return;
      setIsChecklistTemplateFormOpen(true);
      setChecklistTemplateToEdit(checklistTemplate); 
  };

  // Функция, вызываемая при успешном создании или редактировании шаблона чек-листа
  const handleChecklistTemplateFormSuccess = () => {
      setIsChecklistTemplateFormOpen(false); 
      setChecklistTemplateToEdit(undefined); 
      fetchChecklistTemplates(); 
    
  };

  // Функция, вызываемая при отмене или закрытии формы
  const handleChecklistTemplateFormCancel = () => {
      setIsChecklistTemplateFormOpen(false); 
      setChecklistTemplateToEdit(undefined); 
  
  };

  // --- Обработчики для удаления шаблона чек-листа ---

  const handleDeleteChecklistTemplateClick = (checklistTemplateId: number, checklistTemplateName: string) => {
      if (deletingZoneId !== null || isZoneConfirmModalOpen || deletingCleaningTypeId !== null || isCleaningTypeConfirmModalOpen || isZoneFormOpen || isCleaningTypeFormOpen || deletingChecklistTemplateId !== null || isChecklistTemplateFormOpen) return;
      setIsChecklistTemplateConfirmModalOpen(true);
      setChecklistTemplateToDeleteId(checklistTemplateId);
      setChecklistTemplateToDeleteName(checklistTemplateName);
      setError(null); 
  };

  const handleDeleteChecklistTemplateConfirm = async () => {
      if (checklistTemplateToDeleteId === null) return;

      setDeletingChecklistTemplateId(checklistTemplateToDeleteId); 

      try {
          
          const response = await api.delete(`/api/checklisttemplates/${checklistTemplateToDeleteId}/`); 

          if (response.status === 204) { 
              console.log(`Шаблон чек-листа "${checklistTemplateToDeleteName}" успешно удален.`);
              fetchChecklistTemplates(); 
              // TODO: Возможно, нужно обновить список типов уборок, если они связаны с шаблонами
          } else {
                setError('Не удалось удалить шаблон чек-листа. Статус: ' + response.status);
                console.error("Failed to delete checklist template. Status:", response.status);
          }

      } catch (err) {
          console.error(`Error deleting checklist template with ID ${checklistTemplateToDeleteId}:`, err);
          if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.detail || err.response.data.message || JSON.stringify(err.response.data) || 'Ошибка при удалении шаблона чек-листа.');
          } else if (axios.isAxiosError(err) && err.request) {
                setError('Нет ответа от сервера при удалении шаблона чек-листа. Проверьте подключение.');
          } else {
              setError('Произошла непредвиденная ошибка при удалении шаблона чек-листа.');
          }
      } finally {
          setDeletingChecklistTemplateId(null);
          setChecklistTemplateToDeleteId(null);
          setChecklistTemplateToDeleteName(null); 
          setIsChecklistTemplateConfirmModalOpen(false); 
      }
  };

  const handleDeletingChecklistTemplateCancel = () => {
      setIsChecklistTemplateConfirmModalOpen(false); 
      setChecklistTemplateToDeleteId(null); 
      setChecklistTemplateToDeleteName(null); 
      
  };


  // --- Условный рендеринг ---


  if (isAuthLoading) {
      return null;
  }


    if (!user || user.role !== 'manager') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="p-8 rounded-lg shadow-lg bg-white max-w-md w-full text-center text-red-600 font-bold">
                    У вас нет прав для просмотра этой страницы. Доступно только менеджерам.
                </div>
            </div>
        );
    }


    if (isLoadingData && !isZoneFormOpen && !isZoneConfirmModalOpen && deletingZoneId === null && !isCleaningTypeFormOpen && !isCleaningTypeConfirmModalOpen && deletingCleaningTypeId === null && !isChecklistTemplateFormOpen && !isChecklistTemplateConfirmModalOpen && deletingChecklistTemplateId === null) {
        
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <Spinner/>
            </div>
        );
    }

    
    if (error && !isZoneFormOpen && !isZoneConfirmModalOpen && deletingZoneId === null && !isCleaningTypeFormOpen && !isCleaningTypeConfirmModalOpen && deletingCleaningTypeId === null && !isChecklistTemplateFormOpen && !isChecklistTemplateConfirmModalOpen && deletingChecklistTemplateId === null) {
        return (
            <ErrorMessage
               message={error}
               
               onRetry={() => {
                   setIsLoadingData(true); 
                   setError(null); 
                   Promise.all([fetchZones(), fetchCleaningTypes()])
                       .catch(err => console.error("Error during retry fetch:", err))
                       .finally(() => setIsLoadingData(false));
               }}
               isLoading={isLoadingData} 
           />
        );
    }



  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Настройка уборки</h1>

      {/* Секция "Зоны" */}
      <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Зоны</h2>
              {/* Кнопка создания зоны */}
              <button
                  onClick={handleCreateZone}
                  // Отключаем кнопку, если открыта форма или идет удаление (любое)
                  disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Plus size={18} className="inline mr-1"/> Создать зону
              </button>
          </div>

          {/* Таблица зон */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                  <thead>
                      <tr>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Название
                          </th>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Этаж
                          </th>
                           <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Описание
                          </th>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Действия
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      {zones.map(zone => (
                          <tr key={zone.id}>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                  {zone.name}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                  {zone.floor || 'Не указан'}
                              </td>
                               <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                  {zone.description || 'Нет описания'}
                              </td>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                  {/* Кнопки действий для зоны */}
                                  <button
                                      onClick={() => handleEditZone(zone)}
                                      className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                      // Отключаем кнопку, если открыта форма или идет удаление (любое)
                                      disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                                  >
                                      Редактировать
                                  </button>
                                  <button
                                      onClick={() => handleDeleteZoneClick(zone.id, zone.name)}
                                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                      // Отключаем кнопку, если идет удаление именно этой зоны, открыта форма или открыто модальное окно подтверждения (любое)
                                      disabled={deletingZoneId === zone.id || isZoneFormOpen || isZoneConfirmModalOpen || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                                  >
                                      {deletingZoneId === zone.id ? 'Удаление...' : 'Удалить'} {/* Изменяем текст кнопки при удалении */}
                                  </button>
                              </td>
                          </tr>
                      ))}
                       {/* Сообщение, если список зон пуст */}
                        {zones.length === 0 && !isLoadingData && !error && !isZoneFormOpen && !isZoneConfirmModalOpen && deletingZoneId === null && !isCleaningTypeFormOpen && !isCleaningTypeConfirmModalOpen && deletingCleaningTypeId === null && !isChecklistTemplateFormOpen && !isChecklistTemplateConfirmModalOpen && deletingChecklistTemplateId === null && (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-500 py-4">Зоны не найдены.</td>
                            </tr>
                        )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Секция "Типы уборок" */}
      <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Типы уборок</h2>
              {/* Кнопка создания типа уборки */}
              <button
                  onClick={handleCreateCleaningType}
                   // Отключаем кнопку, если открыта форма или идет удаление (любое)
                  disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Plus size={18} className="inline mr-1"/> Создать тип уборки
              </button>
          </div>

          {/* Таблица типов уборок */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full leading-normal">
                  <thead>
                      <tr>
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Название
                          </th>
                          {/* TODO: Добавить колонку "Описание", если нужно отображать */}
                          {/* <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Описание
                          </th> */}
                          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Действия
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      {cleaningTypes.map(cleaningType => (
                          <tr key={cleaningType.id}>
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                  {cleaningType.name}
                              </td>
                              {/* TODO: Отображать описание, если колонка добавлена */}
                              {/* <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                  {cleaningType.description || 'Нет описания'}
                              </td> */}
                              <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                  {/* Кнопки действий для типа уборки */}
                                  <button
                                      onClick={() => handleEditCleaningType(cleaningType)}
                                      className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                       // Отключаем кнопку, если открыта форма или идет удаление (любое)
                                      disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                                  >
                                      Редактировать
                                  </button>
                                  <button
                                      onClick={() => handleDeleteCleaningTypeClick(cleaningType.id, cleaningType.name)}
                                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                      // Отключаем кнопку, если идет удаление именно этого типа, открыта форма или открыто модальное окно подтверждения (любое)
                                      disabled={deletingCleaningTypeId === cleaningType.id || isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                                  >
                                      {deletingCleaningTypeId === cleaningType.id ? 'Удаление...' : 'Удалить'} {/* Изменяем текст кнопки при удалении */}
                                  </button>
                              </td>
                          </tr>
                      ))}
                       {/* Сообщение, если список типов уборок пуст */}
                        {cleaningTypes.length === 0 && !isLoadingData && !error && !isZoneFormOpen && !isZoneConfirmModalOpen && deletingZoneId === null && !isCleaningTypeFormOpen && !isCleaningTypeConfirmModalOpen && deletingCleaningTypeId === null && !isChecklistTemplateFormOpen && !isChecklistTemplateConfirmModalOpen && deletingChecklistTemplateId === null && (
                            <tr>
                                <td colSpan={2} className="text-center text-gray-500 py-4">Типы уборок не найдены.</td> {/* colSpan={2} или 3, если добавлено описание */}
                            </tr>
                        )}
                  </tbody>
              </table>
          </div>
      </div>
      {/* --- Конец секции "Типы уборок" --- */}


      {/* --- Новая секция "Шаблоны чек-листов" --- */}
       <div className="mb-8">
           <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-semibold text-gray-700">Шаблоны чек-листов</h2>
               {/* Кнопка создания шаблона чек-листа */}
               <button
                   onClick={handleCreateChecklistTemplate}
                    // Отключаем кнопку, если открыта форма или идет удаление (любое)
                   disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                   className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   <Plus size={18} className="inline mr-1"/> Создать шаблон чек-листа
               </button>
           </div>

           {/* Таблица шаблонов чек-листов */}
           <div className="bg-white shadow-md rounded-lg overflow-hidden">
               <table className="min-w-full leading-normal">
                   <thead>
                       <tr>
                           <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                               Название
                           </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Тип уборки
                           </th>
                           <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Описание
                           </th>
                           <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Действия
                           </th>
                       </tr>
                   </thead>
                   <tbody>
                       {checklistTemplates.map(template => (
                           <tr key={template.id}>
                               <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                   {template.name}
                               </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                   {/* Используем cleaning_type_name из сериализатора */}
                                   {template.cleaning_type_name || 'Не указан'}
                               </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-gray-900">
                                   {template.description || 'Нет описания'}
                               </td>
                               <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                   {/* Кнопки действий для шаблона */}
                                   <button
                                       onClick={() => handleEditChecklistTemplate(template)}
                                       className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        // Отключаем кнопку, если открыта форма или идет удаление (любое)
                                       disabled={isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen || deletingChecklistTemplateId !== null}
                                   >
                                       Редактировать
                                   </button>
                                   <button
                                       onClick={() => handleDeleteChecklistTemplateClick(template.id, template.name)}
                                       className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                       // Отключаем кнопку, если идет удаление именно этого шаблона, открыта форма или открыто модальное окно подтверждения (любое)
                                       disabled={deletingChecklistTemplateId === template.id || isZoneFormOpen || isZoneConfirmModalOpen || deletingZoneId !== null || isCleaningTypeFormOpen || isCleaningTypeConfirmModalOpen || deletingCleaningTypeId !== null || isChecklistTemplateFormOpen || isChecklistTemplateConfirmModalOpen}
                                   >
                                       {deletingChecklistTemplateId === template.id ? 'Удаление...' : 'Удалить'} {/* Изменяем текст кнопки при удалении */}
                                   </button>
                               </td>
                           </tr>
                       ))}
                        {/* Сообщение, если список шаблонов пуст */}
                         {checklistTemplates.length === 0 && !isLoadingData && !error && !isZoneFormOpen && !isZoneConfirmModalOpen && deletingZoneId === null && !isCleaningTypeFormOpen && !isCleaningTypeConfirmModalOpen && deletingCleaningTypeId === null && !isChecklistTemplateFormOpen && !isChecklistTemplateConfirmModalOpen && deletingChecklistTemplateId === null && (
                             <tr>
                                 <td colSpan={4} className="text-center text-gray-500 py-4">Шаблоны чек-листов не найдены.</td>
                             </tr>
                         )}
                   </tbody>
               </table>
           </div>
       </div>
       {/* --- Конец новой секции "Шаблоны чек-листов" --- */}


      {/* TODO: Секция "Назначение зон горничным" */}


      {/* Модальное окно для формы создания/редактирования зоны */}
      <Modal isOpen={isZoneFormOpen} onClose={handleZoneFormCancel} contentClasses="max-w-sm">
           <ZoneForm zoneToEdit={zoneToEdit} onSuccess={handleZoneFormSuccess} onCancel={handleZoneFormCancel}/>
      </Modal>

       {/* Модальное окно подтверждения удаления зоны */}
       <ConfirmationModal
           isOpen={isZoneConfirmModalOpen}
           message={`Вы уверены, что хотите удалить зону "${zoneToDeleteName}"?`}
           onConfirm={handleDeleteZoneConfirm}
           onCancel={handleDeletingZoneCancel}
           isLoading={deletingZoneId !== null} // isLoading должен быть true, когда deletingZoneId НЕ равен null
       />

      {/* Модальное окно для формы создания/редактирования типа уборки */}
       <Modal isOpen={isCleaningTypeFormOpen} onClose={handleCleaningTypeFormCancel} contentClasses="max-w-sm">
            {/* Передаем список доступных типов уборок, если нужно для формы шаблона */}
            {/* В данном случае, CleaningTypeForm не требует списка типов, но ChecklistTemplateForm будет */}
            <CleaningTypeForm cleaningTypeToEdit={cleaningTypeToEdit} onSuccess={handleCleaningTypeFormSuccess} onCancel={handleCleaningTypeFormCancel}/>
       </Modal>

       {/* Модальное окно подтверждения удаления типа уборки */}
       <ConfirmationModal
           isOpen={isCleaningTypeConfirmModalOpen}
           message={`Вы уверены, что хотите удалить тип уборки "${cleaningTypeToDeleteName}"?`}
           onConfirm={handleDeleteCleaningTypeConfirm}
           onCancel={handleDeletingCleaningTypeCancel}
           isLoading={deletingCleaningTypeId !== null} // isLoading должен быть true, когда deletingCleaningTypeId НЕ равен null
       />

      {/* --- Новые модальные окна для шаблонов чек-листов --- */}
      {/* TODO: Модальное окно для формы создания/редактирования шаблона чек-листа */}

       <Modal isOpen={isChecklistTemplateFormOpen} onClose={handleChecklistTemplateFormCancel} contentClasses="max-w-lg">
            <ChecklistTemplateForm checklistTemplateToEdit={checklistTemplateToEdit} availableCleaningTypes={cleaningTypes} onSuccess={handleChecklistTemplateFormSuccess} onCancel={handleChecklistTemplateFormCancel}/>
       </Modal>

       {/* Модальное окно подтверждения удаления шаблона чек-листа */}
       <ConfirmationModal
           isOpen={isChecklistTemplateConfirmModalOpen}
           message={`Вы уверены, что хотите удалить шаблон чек-листа "${checklistTemplateToDeleteName}"?`}
           onConfirm={handleDeleteChecklistTemplateConfirm}
           onCancel={handleDeletingChecklistTemplateCancel}
           isLoading={deletingChecklistTemplateId !== null} // isLoading должен быть true, когда deletingChecklistTemplateId НЕ равен null
       />
      {/* --- Конец новых модальных окон --- */}


    </div>
  );
}