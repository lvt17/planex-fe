export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    // Only show if the page is currently hidden or in the background
    if (document.visibilityState === 'hidden') {
        const notification = new Notification(title, {
            icon: '/favicon.ico', // You might want to use a better icon
            ...options,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};
