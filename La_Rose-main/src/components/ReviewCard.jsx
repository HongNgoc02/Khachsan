// /src/components/ReviewCard.jsx

import React, { useState } from 'react';

const ReviewCard = ({ review }) => {
  // Lấy dữ liệu từ review object (đã được format ở HomePage)
  // Đặt giá trị mặc định để tránh lỗi
  const rating = review.rating || 5;
  const name = review.name || 'Khách ẩn danh';
  const comment = review.comment || 'Không có nội dung đánh giá.';
  const title = review.title; // Tiêu đề có thể là null
  const images = review.images || [];
  const videos = review.videos || [];
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(images[currentImageIndex + 1]);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(images[currentImageIndex - 1]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100 group">
      {/* Header với avatar và rating */}
      <div className="flex items-start mb-4">
        {/* Avatar với gradient */}
        <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <h5 className="font-semibold text-gray-800 text-lg mb-1 truncate">{name}</h5>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-sm text-gray-500 ml-1">({rating}/5)</span>
          </div>
        </div>
      </div>
      
      {/* Tiêu đề với icon */}
      {title && (
        <div className="mb-3">
          <h6 className="font-semibold text-gray-800 text-base leading-tight flex items-start">
            <svg className="w-5 h-5 text-rose-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="line-clamp-2">"{title}"</span>
          </h6>
        </div>
      )}
      
      {/* Nội dung comment với better styling */}
      <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4 line-clamp-4 group-hover:line-clamp-none transition-all">
        "{comment}"
      </p>
      
      {/* Media section với badge */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          {/* Badge tổng số media */}
          <div className="flex items-center gap-2 mb-3">
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {images.length} ảnh
              </span>
            )}
            {videos.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {videos.length} video
              </span>
            )}
          </div>

          {/* Image gallery với improved layout */}
          {images.length > 0 && (
            <div className="mb-3">
              {images.length === 1 ? (
                <div 
                  className="relative w-full rounded-xl overflow-hidden cursor-pointer group/image"
                  onClick={() => openLightbox(images[0], 0)}
                >
                  <img 
                    src={images[0]} 
                    alt="Review image"
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover/image:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              ) : images.length === 2 ? (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group/image"
                      onClick={() => openLightbox(image, index)}
                    >
                      <img 
                        src={image} 
                        alt={`Review image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-30 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {images.slice(0, 3).map((image, index) => (
                    <div 
                      key={index}
                      className={`relative rounded-lg overflow-hidden cursor-pointer group/image ${
                        index === 2 && images.length > 3 ? 'col-span-1' : ''
                      }`}
                      onClick={() => openLightbox(image, index)}
                    >
                      <div className="aspect-square">
                        <img 
                          src={image} 
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                        />
                      </div>
                      {index === 2 && images.length > 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">+{images.length - 3}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-20 transition-all duration-300" />
                    </div>
                  ))}
                  {images.length > 3 && (
                    <div 
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group/image"
                      onClick={() => openLightbox(images[3], 3)}
                    >
                      <img 
                        src={images[3]} 
                        alt="Review image 4"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                      />
                      {images.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">+{images.length - 4}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-20 transition-all duration-300" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Video với better styling */}
          {videos.length > 0 && (
            <div className="space-y-2">
              {videos.map((video, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden bg-gray-900">
                  <video 
                    src={video}
                    className="w-full rounded-xl"
                    controls
                    style={{ maxHeight: '240px' }}
                    poster=""
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Enhanced Lightbox với navigation */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            setSelectedImage(null);
            setCurrentImageIndex(0);
          }}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
              setCurrentImageIndex(0);
            }}
            className="absolute top-6 right-6 text-white text-3xl font-light bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          >
            ×
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {currentImageIndex < images.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div className="relative max-w-6xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Review image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;