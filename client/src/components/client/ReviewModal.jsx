import { useState } from 'react';
import { StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ReviewModal = ({ isOpen, onClose, onSubmit, expertName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment });
    setRating(5);
    setComment('');
  };

  const handleStarClick = (selectedRating, isHalf = false) => {
    if (isHalf) {
      setRating(selectedRating - 0.5);
    } else {
      setRating(selectedRating);
    }
  };

  const handleMouseOver = (star, isHalf = false) => {
    if (isHalf) {
      setHoverRating(star - 0.5);
    } else {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  // Get the rating text based on rating value
  const getRatingText = () => {
    if (rating <= 1) return 'Rất không hài lòng';
    if (rating <= 2) return 'Không hài lòng';
    if (rating <= 3) return 'Bình thường';
    if (rating <= 4) return 'Hài lòng';
    return 'Rất hài lòng';
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Đóng</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Đánh giá chuyên gia {expertName}
                </h3>
                
                <form onSubmit={handleSubmit}>
                  {/* Rating stars */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đánh giá của bạn
                    </label>
                    <div className="flex justify-center sm:justify-start">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const displayRating = hoverRating || rating;
                          const isFullStar = star <= Math.floor(displayRating);
                          const isHalfStar = star === Math.ceil(displayRating) && !Number.isInteger(displayRating);
                          
                          return (
                            <div key={star} className="relative" style={{ width: '40px', height: '32px' }}>
                              {/* Container cho left half */}
                              <div
                                className="absolute inset-0 w-1/2 cursor-pointer z-10"
                                onClick={() => handleStarClick(star, true)}
                                onMouseOver={() => handleMouseOver(star, true)}
                                onMouseLeave={handleMouseLeave}
                              ></div>
                              
                              {/* Container cho right half */}
                              <div
                                className="absolute inset-0 left-1/2 w-1/2 cursor-pointer z-10"
                                onClick={() => handleStarClick(star)}
                                onMouseOver={() => handleMouseOver(star)}
                                onMouseLeave={handleMouseLeave}
                              ></div>
                              
                              {/* Star display */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {isFullStar ? (
                                  <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                                ) : isHalfStar ? (
                                  <div className="relative h-8 w-8">
                                    <StarIcon className="absolute h-8 w-8 text-gray-300" />
                                    <div className="absolute inset-0 overflow-hidden w-1/2">
                                      <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <StarIcon className="h-8 w-8 text-gray-300" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 text-center sm:text-left flex items-center justify-center sm:justify-start">
                      <span className="font-medium text-gray-700 mr-2">{rating.toFixed(1)}</span>
                      {getRatingText()}
                    </p>
                  </div>

                  {/* Comment */}
                  <div className="mb-6">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận xét của bạn
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows="4"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Chia sẻ trải nghiệm của bạn về buổi tư vấn này..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Gửi đánh giá
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={onClose}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal; 