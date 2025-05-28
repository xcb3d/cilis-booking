import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * Component nhập thông tin liên hệ
 * @param {Object} props
 * @param {Object} props.register - React Hook Form register function
 * @param {Object} props.errors - React Hook Form errors
 * @param {Object} props.user - Thông tin người dùng hiện tại
 */
const ContactForm = ({ register, errors, user }) => {
  return (
    <form>
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Họ và tên
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Vui lòng nhập họ tên' })}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.name ? 'border-red-300' : ''
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
            {user?.name && (
              <p className="mt-1 text-xs text-blue-600">Điền tự động từ hồ sơ</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Số điện thoại
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="phone"
              {...register('phone', { 
                required: 'Vui lòng nhập số điện thoại',
                pattern: {
                  value: /^[0-9]{10}$/i,
                  message: 'Số điện thoại không hợp lệ'
                }
              })}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.phone ? 'border-red-300' : ''
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
            {user?.phone && (
              <p className="mt-1 text-xs text-blue-600">Điền tự động từ hồ sơ</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              id="email"
              {...register('email', { 
                required: 'Vui lòng nhập email',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ'
                }
              })}
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.email ? 'border-red-300' : ''
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
            {user?.email && (
              <p className="mt-1 text-xs text-blue-600">Điền tự động từ hồ sơ</p>
            )}
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Nội dung tư vấn <span className="text-gray-500 text-xs">(không bắt buộc)</span>
          </label>
          <div className="mt-1">
            <textarea
              id="message"
              rows="4"
              {...register('message')}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Nhập nội dung bạn muốn tư vấn..."
            ></textarea>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ContactForm; 