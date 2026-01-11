import React, { useEffect } from 'react';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    width = 'sm',
    showCloseButton = true,
    closeOnBackdropClick = true,
    footer,
    className = '',
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const getWidthClass = () => {
        const widthMap = {
            'sm': 'max-w-sm',
            'md': 'max-w-md',
            'lg': 'max-w-lg',
            'xl': 'max-w-xl',
            '2xl': 'max-w-2xl',
            '3xl': 'max-w-3xl',
            '4xl': 'max-w-4xl',
            'full': 'max-w-full mx-4',
        };
        return widthMap[width] || '';
    };

    const isCustomWidth = !['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'].includes(width);
    const widthStyle = isCustomWidth ? { maxWidth: width } : {};

    const handleBackdropClick = (e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={handleBackdropClick}
        >
            <div 
                className={`bg-white p-8 rounded-lg w-full ${getWidthClass()} ${className}`}
                style={widthStyle}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || showCloseButton) && (
                    <div className="flex justify-between items-center mb-4">
                        {title && <h2 className="text-2xl font-bold">{title}</h2>}
                        {showCloseButton && (
                            <button 
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                )}

                <div className="modal-content">
                    {children}
                </div>
                
                {footer && (
                    <div className="modal-footer mt-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;

