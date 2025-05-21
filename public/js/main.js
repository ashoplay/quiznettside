// Vent til DOM er lastet
document.addEventListener('DOMContentLoaded', function() {
    // Automatisk lukk meldinger etter 5 sekunder
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert && alert.parentNode) {
                $(alert).alert('close');
            }
        }, 5000);
    });

    // Aktiver tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Aktiver popovers
    $('[data-toggle="popover"]').popover();
});

// Add this to handle CSRF tokens in AJAX requests
$(document).ready(function() {
    // Get CSRF token
    const csrfToken = $('meta[name="csrf-token"]').attr('content');
    
    // Set up AJAX to include CSRF token in all requests
    $.ajaxSetup({
        headers: {
            'CSRF-Token': csrfToken
        }
    });
});
