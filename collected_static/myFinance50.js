// Global CSRF Token Variable ----------------------------------------------------------
let csrfToken = '';
let csrfMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfMeta) {
    csrfToken = csrfMeta.content;
    console.log("CSRF Token set:", csrfToken);
} else {
    console.log("CSRF meta tag not found.");
}


// Bootstrap's spinner while loading ---------------------------------------------------

// Function to show the spinner
function showSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('d-none'); // Remove Bootstrap's 'd-none' class to show the spinner
        spinner.classList.add('d-flex');    // Add the flex display class if it's set
    } else {
        console.log("Spinner element not found.");
    }
}

// Function to hide the spinner
function hideSpinner() {
    var spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('d-flex'); // Remove the flex display class if it's set
        spinner.classList.add('d-none');    // Add Bootstrap's 'd-none' class to hide the spinner
    } else {
        console.log("Spinner element not found.");
    }
}

// Hide spinner on initial page load
window.addEventListener('load', hideSpinner);

// Hide spinner on page show (including bfcache restore)
window.addEventListener('pageshow', function(event) {
    hideSpinner();
});

// Show spinner on form submit
document.addEventListener('submit', function(event) {
    if (event.target.tagName.toLowerCase() === 'form') {
        showSpinner();
    }
});

// Show spinner on link click
document.addEventListener('click', function(event) {
    if (event.target.tagName.toLowerCase() === 'a') {
        showSpinner();
    }
});

// Show spinner on window beforeunload
window.addEventListener('beforeunload', function(event) {
    showSpinner();
});

// Show spinner on AJAX start and hide on AJAX complete
(function() {
    var open = XMLHttpRequest.prototype.open;
    var send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function() {
        this.addEventListener('loadstart', function() {
            showSpinner();
        });
        this.addEventListener('loadend', function() {
            hideSpinner();
        });
        open.apply(this, arguments); // Call the original open method
    };

    XMLHttpRequest.prototype.send = function() {
        send.apply(this, arguments); // Call the original send method
    };
})();



// Load DOM before doing all JS below -------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded in myFinance50.js.');
    
    // Get the CSRF token from the meta tag in layout.html
    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Function to setup headers for AJAX requests
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
    
    
    // Allow for tooltip text to appear on any page where it is located. 
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });


    // Show the value of a slider wherever it appears on a page
    if (document.querySelector('.form-control-range[type="range"]')) {
        console.log('from myFinance50.js, adjusting slider output .... ');

        // Select all slider inputs by class
        const sliders = document.querySelectorAll('.form-control-range[type="range"]');

        sliders.forEach(function(slider) {
            // Find the output element associated with this slider
            const output = slider.nextElementSibling;

            // Update the output's value when the slider's value changes
            slider.oninput = function() {
                output.value = parseFloat(this.value).toFixed(2) + '%';
            }
        });
    };


    // Enable Bootstrap5 popovers wherever they appear
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl)
    }) 


    // Show timeout modal warning user about upcoming timeout.
    // Shows popup warning before user is logged out due to inactivity
    var SESSION_COOKIE_AGE_SEC = 900;

    // Timer to track inactivity
    var inactivityTimer;

    // Function to show the timeout modal in layout.html
    function showModal() {
        $('#staticBackdrop').modal('show');
    }

    // Function to reset the inactivity timer
    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(showModal, (SESSION_COOKIE_AGE_SEC - 1 * 60) * 1000); // Show modal 5 minutes before timeout
    }

    document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function() {
            resetTimer();
        });
    });

    // Extend session button in the modal
    var extendButton = document.querySelector('[name="timeout-extend-button"]');
    if (extendButton) { // Check if the extend session button exists before adding event listener
        extendButton.addEventListener('click', function() {
            var readinessCheckUrl = this.getAttribute('data-readiness-check-url'); // Get the URL from the data attribute

            // Implement AJAX request to the readiness_check view that resets the session timer
            $.get(readinessCheckUrl, function(data) {
                if (data.status === 'ready') {
                    resetTimer();
                    $('#staticBackdrop').modal('hide'); // Hide the modal
                }
            });
        });
    }

    // Log out button in the modal
    var logoutButton = document.querySelector('[name="timeout-logout-button"]');
    if (logoutButton) { // Check if the logout button exists before adding event listener
        logoutButton.addEventListener('click', function() {
            var logoutUrl = this.getAttribute('data-logout-url'); // Get the logout URL from the data attribute
            window.location.href = logoutUrl; // Redirect to the logout URL
        });
    }

    // Start the inactivity timer when the page loads, but only if the user is authenticated
    if (document.querySelector('[name="timeout-extend-button"]') || document.querySelector('[name="timeout-logout-button"]')) {
        window.onload = resetTimer;
    }

        
    // Function to format the value of fields with class='form-control USD' as $X,XXX.XX
    function formatInputValue(event) {
        let element = event.target; // The element that triggered the event
        console.log(`formatting '.form-control.USD' element with value: ${element.value}`); // Logs the initial value

        // Remove any non-numeric characters except for the decimal point
        let numericValue = element.value.replace(/[^0-9.]/g, '');
        
        // Attempt to convert the cleaned string to a float
        let unconvertedValue = parseFloat(numericValue);
        if (!isNaN(unconvertedValue)) { // Check if the conversion was successful
            // Format the value with commas and 2 decimal places
            let convertedValue = unconvertedValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

            // Update the element's value with the formatted string, including a dollar sign
            element.value = '$' + convertedValue;
            console.log(`formatted value: ${convertedValue}`); // Logs the formatted value
        } else {
            console.error('Invalid input detected');
        }
    }

    // Attach the 'blur' event listener to all '.form-control.USD' elements
    document.querySelectorAll('.form-control.USD').forEach(function(element) {
        element.addEventListener('blur', formatInputValue);
    });


    // Function to un-format the value of fields with class='form-control USD' before form submission
    function unFormatUSDInputValue(element) {
        console.log(`un-formatting '.form-control.USD' element with value: ${element.value}`); // Logs the initial value

        // Remove any non-numeric characters except for the decimal point
        let numericValue = element.value.replace(/[^0-9.]/g, '');

        // Attempt to convert the cleaned string to a float
        let unformattedValue = parseFloat(numericValue);
        if (!isNaN(unformattedValue)) { // Check if the conversion was successful
            // Ensure the value has 2 decimal places without any formatting
            let convertedValue = unformattedValue.toFixed(2);

            // Update the element's value with the unformatted decimal string
            element.value = convertedValue;
            console.log(`unformatted value: ${convertedValue}`); // Logs the unformatted value
        } else {
            console.error('Invalid input detected');
        }
    }

    // Formats USD user inputs into the correct format
    // Check if there are any elements with the class 'form-control USD' on the page
    var usdInputElements = document.querySelectorAll('.form-control.USD');
    if (usdInputElements.length > 0) {
        // If such elements exist, attach the submit event listener to the form
        // Assuming the form has a specific ID or class, for example 'register-form'
        var form = document.querySelector('#RegisterForm');
        if (form) {
            form.addEventListener('submit', function(event) {
                // Prevent the form from submitting immediately
                event.preventDefault();

                // Run the unFormatUSDInputValue function on all '.form-control.USD' elements
                usdInputElements.forEach(function(element) {
                    unFormatUSDInputValue(element);
                });

                // After processing, submit the form programmatically
                form.submit();
            });
        }
    }

    // Control the visibility of the spinner (used while AJAX functions are running)
    function toggleSpinner(show) {
        var spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.add('d-flex');
                spinner.classList.remove('d-none');
            } else {
                spinner.classList.remove('d-flex');
                spinner.classList.add('d-none');
            }
        }
    }
    
    // Declaration of global variables and functions------------------------------------------------------------
    
    // Make the following variables globally accessible 
    let initial_accounting_method;
    let initial_tax_loss_offsets;
    let debounce_timeout = 200;
    let symbolValidationPassed = false;
    let sharesValidationPassed = false;
    let isButtonClicked = false;
    
    if (document.getElementById('id_accounting_method')) {        
        initial_accounting_method = document.getElementById('id_accounting_method').value;
    }
    if (document.getElementById('id_tax_loss_offsets')) {        
        initial_tax_loss_offsets = document.getElementById('id_tax_loss_offsets').value;
    }    

    // Set debounce function globally
    function debounce(func, timeout = debounce_timeout){
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }


    // Determine sequence of JS functions for each page ------------------------------------------------------------
    // javascript for buy ------------------------------------------
    var BuyForm = document.getElementById('BuyForm'); 
    if (BuyForm) {
        console.log("Running myFinance50.js for /buy... ");

        var symbol = document.getElementById('id_symbol');
        var shares = document.getElementById('id_shares');
        var submitButton = document.getElementById('submit_button');
        

        // Debounced symbol validation function
        function debouncedSymbolValidation() {
            // Immediately disable the submit button when input changes
            submitButton.disabled = true;
            jsSymbolValidation().then(() => {
                jsEnableBuySubmitButton(); // Check if the button should be enabled
            });
        }

        // Debounced SymbolLiveSearch function
        function debouncedSymbolLiveSearch() {
            // Immediately disable the submit button when input changes
            submitButton.disabled = true;
            jsSymbolLiveSearch();
        }
        
        // Function that wraps jsSharesValidation with debouncing
        function debouncedSharesValidation() {
            submitButton.disabled = true; // Immediately disable the submit button when input changes
            toggleSpinner(true); // Show spinner
            jsSharesValidation().then(() => {
                jsEnableBuySubmitButton(); // Check if the button should be enabled
                toggleSpinner(false); // Hide spinner
            });
        }

        if (symbol) {
            symbol.addEventListener('keyup', debounce(debouncedSymbolLiveSearch, 300))
            symbol.addEventListener('change', debounce(debouncedSymbolValidation, 300))
        }

        if (symbol.value) {
            var event = new Event('change');
            symbol.dispatchEvent(event);
        }
        
        if (shares) {
            shares.addEventListener('keyup', debounce(debouncedSharesValidation, 100)); // Using the same timeout for consistency
        }

        const BuyForm = document.getElementById('BuyForm');
        BuyForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent form from submitting
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmBuyModal'));
            confirmModal.show();
        });

        const confirmBuyButton = document.getElementById('confirmBuyButton');
        confirmBuyButton.addEventListener('click', function () {
            BuyForm.submit(); // Submit the form
        });
        

    }    
    // /javascript for buy -----------------------------------------------------


    
    // javascript for password_change ------------------------------------------
    var PasswordChangeForm = document.getElementById('PasswordChangeForm'); 
    if (PasswordChangeForm) {
        console.log("Running myFinance50.js for /password_change... ");

        // Pulls in elements if they exist on page and assigns them to variables
        var email = document.getElementById('id_email');
        var password_old = document.getElementById('password_old');
        var password = document.getElementById('id_password');
        var password_confirmation = document.getElementById('id_password_confirmation');

        // Lists the functions to run if the given elements are on the page
        if (email) {
            email.addEventListener('input', function() {
                jsEnablePasswordChangeSubmitButton();
            });
        }

        if (password_old) {
            password_old.addEventListener('input', function() {
                jsEnablePasswordChangeSubmitButton();
            });
        }

        if (password) {
            password.addEventListener('input', function() {
                jsPasswordValidation();
                jsEnablePasswordChangeSubmitButton();
            });
        }

        if (password_confirmation) {
            password_confirmation.addEventListener('input', function() {
                jsPasswordConfirmationValidation();
                jsEnablePasswordChangeSubmitButton();
            });
        }
    }
    // javascript for password_change ----------------------------------------


    // javascript for password-reset -----------------------------------------
    // Check if the password reset form is present on the page
    var passwordResetForm = document.getElementById('PasswordResetForm'); 
    if (passwordResetForm) {
        console.log("Running myFinance50.js for /password_reset... ");

        // Pulls in elements if they exist on page and assigns them to variables
        var email = document.getElementById('id_email')

        // Run functions if given elements are present on the page
        if (email) {
            email.addEventListener('input', function() {
                jsEnablePasswordResetSubmitButton();
            });
        }
    }
    // /javascript for password_request_reset---------------------------------


    
    // javascript for password_reset_confirmation------------------------------
    var PasswordResetConfirmationForm = document.getElementById('PasswordResetConfirmationForm');
    if (PasswordResetConfirmationForm) {
        console.log("Running myFinance50.js for /password_reset_request_new... ");

        // Pulls in elements if they exist on page and assigns them to variables
        var password = document.getElementById('id_password')
        var password_confirmation = document.getElementById('id_password_confirmation')

        // Run functions if given elements are present on the page
        if (password) {
            password.addEventListener('input', function() {
                jsPasswordValidation();
                jsEnablePasswordRequestConfirmationSubmitButton();
            });
        }

        if (password_confirmation) {
            password_confirmation.addEventListener('input', function() {
                jsPasswordConfirmationValidation();
                jsEnablePasswordRequestConfirmationSubmitButton();
            });
        }
    }
    // /javascript for password_reset_confirmation-----------------------------

    
    
    // javascript for profile ------------------------------------------------
    if (window.location.href.includes('/profile')) {
        console.log("Running myFinance50.js for /profile... ");
        
        // Pulls in elements if they exist on page and assigns them to variables
        var updateButtonNameFull = document.getElementById('updateButtonNameFull');
        var first_name = document.getElementById('id_first_name');
        var last_name = document.getElementById('id_last_name');
        var updateButtonUsername = document.getElementById('updateButtonUsername');
        var username = document.getElementById('id_username');
        var accounting_method = document.getElementById('id_accounting_method');
        var tax_loss_offsets = document.getElementById('id_tax_loss_offsets');
        var tax_rate_STCG= document.getElementById('id_tax_rate_STCG');
        var tax_rate_STCG_value = document.getElementById('tax_rate_STCG');
        var tax_rate_LTCG= document.getElementById('id_tax_rate_LTCG');
        var tax_rate_LTCG_value = document.getElementById("tax_rate_LTCG");
        var profileForm = document.querySelector('form'); // Selects the only form on the page

        // Capture the profile form submission
        if (profileForm) {
            profileForm.addEventListener('submit', function(event) {
                var taxRateSTCGValue = parseFloat(document.getElementById('tax_rate_STCG_value').innerText.replace('%', '')).toFixed(2);
                var hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'tax_rate_STCG'; // The name must match what you expect on the server side
                hiddenInput.value = taxRateSTCGValue;
                profileForm.appendChild(hiddenInput);
            });
        }

        if (updateButtonNameFull) {
            updateButtonNameFull.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent the default anchor action
                jsShowHiddenNameField(); // Call the function
            });
        }

        if (first_name) {
            first_name.addEventListener('input', function() {
                jsEnableProfileSubmitButton();
            });
        }

        if (last_name) {
            last_name.addEventListener('input', function() {
                jsEnableProfileSubmitButton();
            });
        }

        if (updateButtonUsername) {
            updateButtonUsername.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent the default anchor action
                jsShowHiddenUsernameField(); // Call the function
            });
        }

        if (username) {
            document.getElementById('id_username').addEventListener('input', function() {
                jsUsernameValidation(); 
                jsEnableProfileSubmitButton();
            });
        }

            if (accounting_method) {
                document.getElementById('id_accounting_method').addEventListener('input', function() { 
                    jsEnableProfileSubmitButton();
                });
            }

            if (tax_loss_offsets) {
                document.getElementById('id_tax_loss_offsets').addEventListener('input', function() { 
                    jsEnableProfileSubmitButton();
                });
            }

        if (tax_rate_STCG) {
            tax_rate_STCG.addEventListener('input', function() {
                jsEnableProfileSubmitButton();
            });
        }

        if (tax_rate_LTCG) {
            document.getElementById('id_tax_rate_LTCG').addEventListener('input', function() { 
                jsEnableProfileSubmitButton();
            });
        }
    }
    // /javascript for profile -----------------------------------------------



    // javascript for quote ---------------------------------------------------
    var QuoteForm = document.getElementById('QuoteForm');
    if (QuoteForm) {
        console.log("Running myFinance50.js for /quote... ");
        
        var symbol = document.getElementById('id_symbol');
        var submitButton = document.getElementById('submit_button');
        
        // Debounced symbol validation function
        function debouncedSymbolValidation() {
            // Immediately disable the submit button when input changes
            submitButton.disabled = true;
            jsSymbolValidation().then(() => {
                jsEnableQuoteSubmitButton(); // Check if the button should be enabled
            });
        }

        // Debounced SymbolLiveSearch function
        function debouncedSymbolLiveSearch() {
            // Immediately disable the submit button when input changes
            submitButton.disabled = true;
            jsSymbolLiveSearch();
        }
        
        if (symbol) {
            symbol.addEventListener('keyup', debounce(debouncedSymbolLiveSearch, 300))
            symbol.addEventListener('keyup', debouncedSymbolValidation)
            symbol.addEventListener('change', debounce(debouncedSymbolValidation, 300))
        }    
    }
    // /javascript for quote ---------------------------------------------------



    // javascript for register -----------------------------------------------
    var RegisterForm = document.getElementById('RegisterForm');
    if (RegisterForm) {
        console.log("Running myFinance50.js for /register... ");
        
        var first_name = document.getElementById('id_first_name');
        var last_name = document.getElementById('id_last_name');
        var username = document.getElementById('id_username');
        var email = document.getElementById('id_email');
        var password = document.getElementById('id_password');
        var password_confirmation = document.getElementById('id_password_confirmation');
        var submitButton = document.getElementById('submit_button');        
        var RegisterForm = document.querySelector('form'); // Selects the only form on the page

        if (first_name) {
            first_name.addEventListener('input', function() {
                jsEnableRegisterSubmitButton();
            });
        }
        
        if (last_name) {
            last_name.addEventListener('input', function() {
                jsEnableRegisterSubmitButton();
            });
        }
        
        
        /* DISABLED
        function debouncedEmailValidation() {
            submitButton.disabled = true;
            // Immediately disable the submit button when input changes
            jsEmailValidation().then(() => { 
                jsEnableRegisterSubmitButton();
           });
        }
        
        /* TEMPORARILY DISABLED
        if (email) {
            email.addEventListener('input', debounce(debouncedEmailValidation, 300));
        }
        */
             
        function debouncedUsernameValidation() {
            submitButton.disabled = true;
            // Immediately disable the submit button when input changes
            jsUsernameValidation().then(() => { 
                jsEnableRegisterSubmitButton();
           });
        }

        if (username) {
            username.addEventListener('input', debounce(debouncedUsernameValidation, 300));
        }
        
        function debouncedPasswordValidation() {
            submitButton.disabled = true;
            // Immediately disable the submit button when input changes
            jsPasswordValidation().then(() => { 
                jsEnableRegisterSubmitButton();
           });
        }

        if (password) {
            password.addEventListener('input', debounce(debouncedPasswordValidation, 100));
        }

        if (password_confirmation) {
            password_confirmation.addEventListener('input', function() {
                jsPasswordConfirmationValidation();
                jsEnableRegisterSubmitButton();
            });
        }
    } 
    // /javascript for register ----------------------------------------------



    // javascript for sell ------------------------------------------
    if (window.location.href.includes('/sell')) {
        console.log('running myFinance50.js for /sell ... ');
        
        var symbol = document.getElementById('id_symbol');
        var shares = document.getElementById('id_shares');
        var submitButton = document.getElementById('submit_button');
        
        // Function that wraps jsSharesValidation with debouncing
        function debouncedSharesValidation() {
            submitButton.disabled = true; // Immediately disable the submit button when input changes
            toggleSpinner(true); // Show spinner
            jsSharesValidation().then(() => {
                jsEnableSellSubmitButton(); // Check if the button should be enabled
                toggleSpinner(false); // Hide spinner
            });
        }

        if (symbol) {
            symbol.addEventListener('input', function() {
                // Trigger jsSharesValidation and jsEnableSellSubmitButton
                jsSharesValidation().then(() => {
                    jsEnableSellSubmitButton();
                });
            });
        }
        
        if (shares) {
            shares.addEventListener('input', debounce(debouncedSharesValidation, 500)); // Using the same timeout for consistency
        }

        const sellForm = document.getElementById('SellForm');;
        sellForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent form from submitting
            const confirmModal = new bootstrap.Modal(document.getElementById('confirmSellModal'));
            confirmModal.show();
        });

        const confirmSellButton = document.getElementById('confirmSellButton');
        confirmSellButton.addEventListener('click', function () {
            sellForm.submit(); // Submit the form
        });        
    }
    // /javascript for sell ------------------------------------------




    // Function definitions -------------------------------------------------------------------    

    // The function below provides feedback to the user re: whether a user-inputted email address is already associated with an account.
    function jsEmailValidation() {
        return new Promise((resolve, reject) => {
            var email = document.getElementById('id_email').value.trim();
            var email_validation = document.getElementById('email_validation');
            console.log(`Running jsUsernameValidation()... username is: ${username}`);
    
            // Clear any previous states to prevent residual styling
            email_validation.classList.remove('text-available', 'text-taken', 'text-error');
    
            if (email === '') {
                console.log(`Running jsEmailValidation()... email === '' (email is empty)`);
                email_validation.innerHTML = '';
                email_validation.classList.add('d-none');
                submit_enabled = false;
                resolve(submit_enabled);
            } else {
                console.log(`Running jsEmailValidation()... email != '' (email is not empty)`);
                fetch('/myfinance50/check_email_registered/', {
                    method: 'POST',
                    body: new URLSearchParams({ 'user_input': email }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                    }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Server responded with a non-200 status');
                    }
                })
                .then(data => {
                    if (data.email === null) {
                        email_validation.innerHTML = 'Email available';
                        email_validation.classList.add('text-available');
                        submit_enabled = true;
                    } else {
                        email_validation.innerHTML = `Email '${data.email}' is already associated with an account.`;
                        email_validation.classList.add('text-taken');
                        submit_enabled = false;
                    }
                    email_validation.classList.remove('d-none'); // Ensure visibility regardless of state
                    resolve(submit_enabled);
                })
                .catch(error => {
                    console.error('Error:', error);
                    email_validation.innerHTML = 'An error occurred. Please try again.';
                    email_validation.classList.add('text-error');
                    email_validation.classList.remove('d-none');
                });
            }
        });
    }



    // Provides feedback to user whether user-inputted PW meets PW requirements.
    function jsPasswordValidation() {
        return new Promise((resolve, reject) => {
            var password = document.getElementById('id_password').value.trim();
            var password_confirmation = document.getElementById('id_password_confirmation').value.trim();
            var regLiMinTotChars = document.getElementById('pw_min_tot_chars_li');
            var regLiMinLetters = document.getElementById('pw_min_letters_li');
            var regLiMinNum = document.getElementById('pw_min_num_li');
            var regLiMinSym = document.getElementById('pw_min_sym_li');
            console.log(`Running jsPasswordValidation()`)
            
            // Helper function: resets color of element to black
            function resetColor(elements) {
                if (!Array.isArray(elements)) {
                    elements = [elements]; // Wrap the single element in an array
                }
                elements.forEach(element => {
                    element.classList.remove('text-available');
                });
            }

            // Helper function: set color of element to #22bd39 (success green)
            function setGreen(elements) {
                if (!Array.isArray(elements)) {
                    elements = [elements]; // Wrap the single element in an array
                }
                elements.forEach(element => {
                    element.classList.remove('text-taken');
                    element.classList.add('text-available');
                });
            }
            
            // If password is blank, reset the color of the elements below and return false.
            if (password === '') {
                resetColor([regLiMinTotChars, regLiMinLetters, regLiMinNum, regLiMinSym]);
                return resolve(false);
            }
            // If password is not blank, then toss the value over to the /check_password_strength in app.py
            fetch('/myfinance50/check_password_valid/', {
                method: 'POST',
                body: new URLSearchParams({ 
                    'password': password,
                    'password_confirmation': password_confirmation
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                }
            })
            // Do the following with the result received back from app.py
            .then(response => response.json())
            .then(data => {
                let submit_enabled = true;
                if (data.checks_passed.includes('pw_reg_length')) {
                    setGreen(regLiMinTotChars);
                } else {
                    resetColor(regLiMinTotChars);
                    submit_enabled = false;
                }
                if (data.checks_passed.includes('pw_req_letter')) {
                    setGreen(regLiMinLetters);
                } else {
                    resetColor(regLiMinLetters);
                    submit_enabled = false;
                }
                if (data.checks_passed.includes('pw_req_num')) {
                    setGreen(regLiMinNum);
                } else {
                    resetColor(regLiMinNum);
                    submit_enabled = false;
                }
                if (data.checks_passed.includes('pw_req_symbol')) {
                    setGreen(regLiMinSym);
                } else {
                    resetColor(regLiMinSym);
                    submit_enabled = false;
                }

                resolve(submit_enabled);
            })
            .catch(error => {
                console.error('Error: password checking in registration has hit an error.', error);
                reject(error);
            });
        });
    }



    // Provides feedback to user regarding whether user-inputted password == user-inputted password_confirmation.
    function jsPasswordConfirmationValidation() {
        return new Promise((resolve, reject) => {
            var password = document.getElementById('id_password').value.trim();
            var password_confirmation = document.getElementById('id_password_confirmation').value.trim();
            var password_confirmation_validation_match = document.getElementById('password_confirmation_validation_match') 
            console.log(`Running jsPasswordConfirmationValidation()`)
            console.log(`running jsPasswordConfirmationValidation()... CSRF Token is: ${csrfToken}`);
            
            // Helper function: resets color of element to black
            function resetColor(elements) {
                if (!Array.isArray(elements)) {
                    elements = [elements]; // Wrap the single element in an array
                }
                elements.forEach(element => {
                    element.classList.remove('text-available');
                });
            }

            // Helper function: set color of element to #22bd39 (success green)
            function setColor(elements) {
                if (!Array.isArray(elements)) {
                    elements = [elements]; // Wrap the single element in an array
                }
                elements.forEach(element => {
                    element.classList.remove('text-taken');
                    element.classList.add('text-available');
                });
            }
            
            // If password is blank, reset the color of the elements below and return false.
            if (password_confirmation === '') {
                resetColor([password_confirmation_validation_match]);
                return resolve(false);
            }
            // If password is not blank, then toss the value over to the /check_password_strength in app.py
            fetch('/myfinance50/check_password_valid/', {
                method: 'POST',
                body: new URLSearchParams({ 
                    'password': password,
                    'password_confirmation': password_confirmation
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                }
            })
            // Do the following with the result received back from app.py
            .then(response => response.json())
            .then(data => {
                let submit_enabled = true;
                if (data.confirmation_match == true) {
                    setColor(password_confirmation_validation_match);
                } else {
                    resetColor(password_confirmation_validation_match);
                    submit_enabled = false;
                }
                resolve(submit_enabled);
            })
            .catch(error => {
                console.error('Error: password checking in registration has hit an error.', error);
                reject(error);
            });
        });
    }



    // Tells user if the buy or sell transaction can proceed subject to sufficient cash (share purchase) or sufficient shares held (share sale).
    function jsSharesValidation() {
        return new Promise((resolve, reject) => {
            var transaction_type = document.getElementById('id_transaction_type').value;
            var symbol = document.getElementById('id_symbol');
            var user_input_symbol = symbol.value;
            console.log(`running jsSharesValidation ... user_input_symbol is ${ user_input_symbol }`)
            var shares = document.getElementById('id_shares');
            var user_input_shares = shares.value;
            var shares_validation = document.getElementById('shares_validation');
            console.log(`running jsSharesValidation ... user_input_shares is ${ user_input_shares }`)



            sharesValidationPassed = false;

            if (user_input_shares === '' || user_input_symbol === '') {
                shares_validation.innerHTML = '';
                shares_validation.classList.add('d-none');
                sharesValidationPassed = false;
                resolve(sharesValidationPassed);
            } else {
                fetch('/myfinance50/check-shares/', {
                    method: 'POST',
                    body: new URLSearchParams({ 'symbol': user_input_symbol, 'shares': user_input_shares, 'transaction_type': transaction_type }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                    }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Running jsSharesValidation()... server responded with a non-200 status');
                    }
                })
                .then(response => {
                    if (response.success) {
                        shares_validation.classList.remove('text-taken');
                        shares_validation.classList.add('text-available');
                        shares_validation.innerHTML = response.message;
                        sharesValidationPassed = true;
                    } else {
                        shares_validation.classList.remove('text-available');
                        shares_validation.classList.add('text-taken');
                        shares_validation.innerHTML = response.message;
                        sharesValidationPassed = false;
                    }
                    shares_validation.classList.remove('d-none');
                    resolve(sharesValidationPassed);
                })
                .catch(error => {
                    shares_validation.classList.remove('d-none');
                    shares_validation.classList.remove('text-available')
                    shares_validation.classList.add('text-taken');
                    shares_validation.innerHTML = 'An error occurred. Please try again.';
                    sharesValidationPassed = false;
                    resolve(sharesValidationPassed);
                });
            }
        });
    }



    // On the profile page, when the box to update the user's name is clicked, input boxes for fist and last name appear.
    function jsShowHiddenNameField() {
        var profile_hidden_name_container = document.getElementById('profile_hidden_name_container');
        var first_name = document.getElementById('id_first_name');
        var last_name = document.getElementById('id_last_name');
        var updateButtonNameFull = document.getElementById('updateButtonNameFull');
        console.log(`Running jsShowHiddenNameField()`)
        console.log(`Running jsShowHiddenNameField()...`)
        console.log(`Running jsShowHiddenNameField()... CSRF Token is ${csrfToken}`);

        
        // Check if hidden content is already hidden
        if (profile_hidden_name_container.classList.contains('d-none')) {
            // Show the container
            profile_hidden_name_container.classList.remove('d-none');
            updateButtonNameFull.innerHTML = 'Undo';
            updateButtonNameFull.classList.remove('btn-primary');
            updateButtonNameFull.classList.add('btn-secondary');
        } else {
            // Hide the container and clear the input field
            profile_hidden_name_container.classList.add('d-none');
            first_name.value = '';
            last_name.value = '';
            updateButtonNameFull.innerHTML = 'Update';
            updateButtonNameFull.classList.remove('btn-secondary');
            updateButtonNameFull.classList.add('btn-primary');
        }
    }


    // On the profile page, when the box to update username is clicked, input boxes for username appears.
    function jsShowHiddenUsernameField() {
        /* Pull in the relevant elements from the html */
        var profile_hidden_username_container = document.getElementById('profile_hidden_username_container');
        var username = document.getElementById('id_username');
        var updateButtonUsername = document.getElementById('updateButtonUsername');
        console.log(`Running jsShowHiddenUsernameField()`)
        console.log(`Running jsShowHiddenUsernameField()...`)
        console.log(`Running jsShowHiddenUsernameField()... CSRF Token is ${csrfToken}`);
        
        // Check if hidden content is already displayed
        if (profile_hidden_username_container.classList.contains('d-none')) {
            // Show the container
            profile_hidden_username_container.classList.remove('d-none');
            updateButtonUsername.innerHTML = 'Undo';
            updateButtonUsername.classList.remove('btn-primary');
            updateButtonUsername.classList.add('btn-secondary');
        } else {
            // Hide the container and clear the input field
            profile_hidden_username_container.classList.add('d-none');
            first_name.value = '';
            last_name.value = '';
            updateButtonUsername.innerHTML = 'Update';
            updateButtonUsername.classList.remove('btn-secondary');
            updateButtonUsername.classList.add('btn-primary');
        }
    }


    // Tells user if a stock symbol is valid (checks listings table in DB).
    function jsSymbolValidation() {
        return new Promise((resolve, reject) => {
            var symbol = document.getElementById('id_symbol');
            var symbol_validation = document.getElementById('symbol_validation');
            var submitButton = document.getElementById('submit_button');
            var user_input = symbol.value.trim();
            console.log(`Running jsSymbolValidation()... User input: ${user_input}`);
            
            symbolValidationPassed = false;

            if (user_input === '') {
                console.log(`User input is empty`);
                symbol_validation.innerHTML = '';
                symbol_validation.classList.add('d-none');
                symbolValidationPassed = false;
                resolve(symbolValidationPassed);
            } else {
                fetch('/myfinance50/check-symbol/', {
                    method: 'POST',
                    body: new URLSearchParams({ 'symbol': user_input }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log(`Valid symbol found: ${user_input}`);
                        symbol_validation.classList.remove('text-taken', 'd-none');
                        symbol_validation.classList.add('text-available');
                        symbol_validation.innerHTML = 'Valid symbol';
                        symbolValidationPassed = true;
                    } else {
                        console.log(`Invalid symbol: ${data.data}`);
                        symbol_validation.classList.remove('text-available', 'd-none');
                        symbol_validation.classList.add('text-taken');
                        symbol_validation.innerHTML = data.data;  // Display the error message from the server
                        symbolValidationPassed = false;
                    }
                    resolve(symbolValidationPassed);
                })
                .catch(error => {
                    console.error('Error:', error);
                    symbol_validation.innerHTML = 'An error occurred. Please try again.';
                    symbol_validation.classList.remove('text-available', 'd-none');
                    symbol_validation.classList.add('text-taken');
                    sharesValidationPassed = false;
                    resolve(sharesValidationPassed);
                });
            }
        });
    }
    
    // Provides suggestions for company symbol, based on user-input for symbol. Searches listings table in DB.
    function jsSymbolLiveSearch() {
        return new Promise((resolve, reject) => {
            var symbol = document.getElementById('id_symbol');
            var symbol_validation = document.getElementById('symbol_validation');
            var symbol_live_search = document.getElementById('symbol_live_search');
            var user_input = symbol.value.trim();
            var submitButton = document.getElementById('submit_button');
            console.log(`Running jsSymbolLiveSearch()`);
    
            if (user_input === '') {
                console.log(`Running jsSymbolLiveSearch()... symbol ===' ' (symbol is empty)`);
                symbol_live_search.innerHTML = '';
                symbol_live_search.classList.add('d-none');
            } else {
                console.log(`Running jsSymbolLiveSearch()... symbol is not empty. Symbol is: ${user_input}`);
                fetch('/myfinance50/check-symbol/', {
                    method: 'POST',
                    body: new URLSearchParams({ 'symbol': user_input }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        console.error(`HTTP error, status = ${response.status}`);
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Data received: ${JSON.stringify(data)}`); // Log the entire data.data array
    
                    // Do the formatting and populating for symbol_live_search
                    if (data.success) {
                        symbol_live_search.innerHTML = '';
                        symbol_live_search.classList.remove('d-none');
                        if (Array.isArray(data.data)) {
                            data.data.forEach(item => {
                                const div = document.createElement('div');
                                div.innerHTML = `${item.symbol} - ${item.name} - ${item.exchange_short}<br/>`;
                                div.classList.add('btn', 'btn-outline-secondary', 'custom-btn-company-search');
                                div.addEventListener('click', function() {
                                    console.log(`Running jsSymbolLiveSearch() ... user clicked LiveSearch result`);
                                    symbol.blur(); // Remove focus from the input
                                    symbol.value = item.symbol; // Populate the symbol input field with the clicked symbol
                                    symbol_live_search.innerHTML = '';
                                    symbol_live_search.classList.add('d-none');
                                    var form = symbol.closest('form'); // Select the closest form (e.g. the one containing 'symbol')
                                    console.log(`Running jsSymbolLiveSearch() ... form.id is: ${ form.id }`);
                                    if (form && form.id === 'QuoteForm') { // If that form is QuoteForm, auto-submit. Do not auto-submit if this function is used elsewhere, such as BuyForm. 
                                        console.log(`Running jsSymbolLiveSearch() ... auto-submitting form`);
                                        form.submit();
                                    }
                                });
                                symbol_live_search.appendChild(div);
                            });
                        } else {
                            console.error('Expected an array but got:', data.data);
                            symbol_live_search.innerHTML = 'No valid data received';
                            symbol_live_search.classList.add('d-none');
                        }
                    } else {
                        symbol_validation.innerHTML = data.data || 'Invalid symbol';
                        symbol_validation.classList.add('text-taken');
                    }
                })
                .catch(error => {
                    console.error('Network or processing error:', error);
                    symbol_validation.innerHTML = 'An error occurred. Please try again.';
                    symbol_validation.classList.add('text-taken');
                });
            }
        });
    }
    



    // Provides feedback re: the availability of a user-inputted username.
    function jsUsernameValidation() {
        return new Promise((resolve, reject) => {
            var username = document.getElementById('id_username').value.trim();
            var username_validation = document.getElementById('username_validation');
            console.log(`Running jsUsernameValidation()... username is: ${username}`);
    
            // Clear any previous states to prevent residual styling
            username_validation.classList.remove('text-available', 'text-taken', 'text-error');
    
            if (username === '') {
                console.log(`Running jsUsernameValidation()... username === '' (username is empty)`);
                username_validation.innerHTML = '';
                username_validation.classList.add('d-none');
                submit_enabled = false;
                resolve(submit_enabled);
            } else {
                console.log(`Running jsUsernameValidation()... username != '' (username is not empty)`);
                fetch('/myfinance50/check_username_registered/', {
                    method: 'POST',
                    body: new URLSearchParams({ 'user_input': username }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': csrfToken,
                    }
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Server responded with a non-200 status');
                    }
                })
                .then(data => {
                    if (data.username === null) {
                        username_validation.innerHTML = 'Username available';
                        username_validation.classList.add('text-available');
                        submit_enabled = true;
                    } else {
                        username_validation.innerHTML = `Username '${data.username}' is already taken.`;
                        username_validation.classList.add('text-taken');
                        submit_enabled = false;
                    }
                    username_validation.classList.remove('d-none'); // Ensure visibility regardless of state
                    resolve(submit_enabled);
                })
                .catch(error => {
                    console.error('Error:', error);
                    username_validation.innerHTML = 'An error occurred. Please try again.';
                    username_validation.classList.add('text-error');
                    username_validation.classList.remove('d-none');
                });
            }
        });
    }
    
    

    // Enables buy button on buy page   
    function jsEnableBuySubmitButton() {
        var submitButton = document.getElementById('submit_button');
        
        // Initially disable submit to ensure button is disabled while promises are in progress
        console.log(`Running jsEnableBuySubmitButton()`)
        console.log(`Running jsEnableBuySubmitButton()... CSRF Token is: ${csrfToken}`);

        // Initially disable submit to prevent premature submissions
        submitButton.disabled = true;

        if (symbolValidationPassed && sharesValidationPassed) {
            console.log('Enabling submit button.');
            submitButton.disabled = false;
        } else {
            console.log('Disabling submit button due to failed or incomplete validation.');
            submitButton.disabled = true;
        }
    }

    
    // Enables submit button on password reset request page
    function jsEnablePasswordResetSubmitButton() {
        var email = document.getElementById('id_email').value.trim();
        var submitButton = document.getElementById('submit_button');
        console.log(`Running jsEnablePasswordResetSubmitButton()`)
        
        if (email === '' ) {
            submitButton.disabled = true;
            console.log(`Running jsEnablePasswordResetSubmitButton()... Submit button disabled.`);
        } else {
            // All validations passed
            console.log(`Running jsEnablePasswordResetSubmitButton()... All validation checks passed, enabling submit button.`);
            submitButton.disabled = false;
        }
    }



    // Enables submit button on password reset page
    async function jsEnablePasswordRequestConfirmationSubmitButton() {
        var password = document.getElementById('id_password').value.trim();
        var password_confirmation = document.getElementById('id_password_confirmation').value.trim();
        var submitButton = document.getElementById('submit_button');

        // Initially disable submit to ensure button is disabled while promises are in progress
        submitButton.disabled = true;

        // Create an array of promises with labels
        var labeledPromises = [
            { label: 'Password Check', promise: jsPasswordValidation() },
            { label: 'Password Confirmation Check', promise: jsPasswordConfirmationValidation() }
        ];
        console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()`)
        console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()... CSRF Token is: ${csrfToken}`);

        Promise.all(labeledPromises.map(labeledPromise => {
            // Add a console.log statement before each promise
            //console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()... Executing promise: ${labeledPromise.label}`);
    
            return labeledPromise.promise.then(result => {
                // Add a console.log statement after each promise resolves
                console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()... Promise (${labeledPromise.label}) resolved with result: ${result}`);
                return { label: labeledPromise.label, result: result };
            });
        }))
            .then((results) => {
                // Log each promise result
                results.forEach(res => {
                    console.log(`Result of ${res.label}: ${res.result}`);
                });
    
                // Check if any of the promises return false
                var allPromisesPassed = results.every(res => res.result === true);
                
                if (!allPromisesPassed) {
                    submitButton.disabled = true;
                    console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()... Submit button disabled.`);
                } else {
                    // All validations passed
                    console.log(`Running jsEnablePasswordRequestConfirmationSubmitButton()... All validation checks passed, enabling submit button.`);
                    submitButton.disabled = false;
                }
            }).catch((error) => {
                // Handle errors if any of the Promises reject
                console.error(`Running jsEnablePasswordRequestConfirmationSubmitButton()... Error is: ${error}.`);
                submitButton.disabled = true;
            });
    }



    // Enables submit button on password change page
    async function jsEnablePasswordChangeSubmitButton() {
        var email = document.getElementById('id_email').value.trim();
        var password_old = document.getElementById('id_password_old').value.trim();
        var submitButton = document.getElementById('submit_button');

        // Initially disable submit to ensure button is disabled while promises are in progress
        submitButton.disabled = true;

        // Create an array of promises with labels
        var labeledPromises = [
            { label: 'Password Check', promise: jsPasswordValidation() },
            { label: 'Password Confirmation Check', promise: jsPasswordConfirmationValidation() }
        ];
        console.log(`Running jsEnablePasswordChangeSubmitButton()`)
        console.log(`Running jsEnablePasswordChangeSubmitButton()... CSRF Token is: ${csrfToken}`);

        Promise.all(labeledPromises.map(labeledPromise => {
            // Add a console.log statement before each promise
            //console.log(`Running jsEnablePasswordChangeSubmitButton()... Executing promise: ${labeledPromise.label}`);
    
            return labeledPromise.promise.then(result => {
                // Add a console.log statement after each promise resolves
                console.log(`Running jsEnablePasswordChangeSubmitButton()... Promise (${labeledPromise.label}) resolved with result: ${result}`);
                return { label: labeledPromise.label, result: result };
            });
        }))
            .then((results) => {
                // Log each promise result
                results.forEach(res => {
                    console.log(`Result of ${res.label}: ${res.result}`);
                });
    
                // Check if any of the promises return false
                var allPromisesPassed = results.every(res => res.result === true);
                
                if (!allPromisesPassed || email === '' || password_old === "" ) {
                    submitButton.disabled = true;
                    console.log(`Running jsEnablePasswordChangeSubmitButton()... Submit button disabled.`);
                } else {
                    // All validations passed
                    console.log(`Running jsEnablePasswordChangeSubmitButton()... All validation checks passed, enabling submit button.`);
                    submitButton.disabled = false;
                }
            }).catch((error) => {
                // Handle errors if any of the Promises reject
                console.error(`Running jsEnablePasswordChangeSubmitButton()... Error is: ${error}.`);
                submitButton.disabled = true;
            });
    }



    // Enables submit button on profile page
    async function jsEnableProfileSubmitButton() {
        var first_name = document.getElementById('id_first_name').value.trim();
        var last_name = document.getElementById('id_last_name').value.trim();
        var username = document.getElementById('id_username').value.trim();
        var username_validation = document.getElementById('username_validation');
        var initial_accounting_method = document.getElementById('initial_accounting_method').value;
        var accounting_method = document.getElementById('id_accounting_method').value;
        var initial_tax_loss_offsets = document.getElementById('initial_tax_loss_offsets').value;
        var tax_loss_offsets = document.getElementById('id_tax_loss_offsets').value;
        var initial_tax_rate_STCG = parseFloat(document.getElementById('initial_tax_rate_STCG').innerText.replace('%', ''));
        var tax_rate_STCG = parseFloat(document.getElementById('id_tax_rate_STCG').innerText.replace('%', ''));
        var initial_tax_rate_LTCG = parseFloat(document.getElementById('initial_tax_rate_LTCG').innerText.replace('%', ''));
        var tax_rate_LTCG = parseFloat(document.getElementById('id_tax_rate_LTCG').innerText.replace('%', ''));
                
        if (username !== '') {
            await jsUsernameValidation();
        }

        var username_validation = username_validation.innerText || username_validation.textContent;
        var submitButton = document.getElementById('submit_button');
        console.log(`Running jsEnableProfileSubmitButton()...`)
        
        console.log("Input Values:", {
            first_name,
            last_name,
            username,
            username_validation,
            initial_accounting_method,
            accounting_method,
            initial_tax_loss_offsets,
            tax_loss_offsets,
            initial_tax_rate_STCG,
            tax_rate_STCG,
            initial_tax_rate_LTCG,
            tax_rate_LTCG,
        });

        // Logic: If any user input field != empty && username_validation passes, enable submit button
        if (
            (first_name !== '' || last_name !== '' || username !== '' || initial_accounting_method !== accounting_method || initial_tax_loss_offsets !== tax_loss_offsets || initial_tax_rate_STCG !== tax_rate_STCG || initial_tax_rate_LTCG !== tax_rate_LTCG) &&
            !username_validation.includes('is already taken.')
        ) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }



    // Enables submit button on quote page
    function jsEnableQuoteSubmitButton() {
        var submitButton = document.getElementById('submit_button');
        var form = submitButton.closest('form');
        var spinner = document.getElementById('loadingSpinner');
        
        // Initially disable submit to ensure button is disabled while promises are in progress
        console.log(`Running jsEnableQuoteSubmitButton() ... `)
        console.log(`Running jsEnableQuoteSubmitButton() ... CSRF Token is: ${csrfToken}`);

        // Initially disable submit to prevent premature submissions
        submitButton.disabled = true;

        // Check if the spinner is visible. Since the spinner is already listening to all the various loading events, it's easier to just listen for the spinner.
        var isSpinnerVisible = spinner && !spinner.classList.contains('d-none');
        console.log(`Running jsEnableQuoteSubmitButton() ... isSpinnerVisible: ${isSpinnerVisible}`);

        if (!isSpinnerVisible) {

            if (symbolValidationPassed) {
                console.log('Running jsEnableQuoteSubmitButton() ... enabling submit button.');
                submitButton.disabled = false;
            } else {
                console.log('Running jsEnableQuoteSubmitButton() ... disabling submit button due to failed or incomplete validation.');
                submitButton.disabled = true;
            }
        }
    }


    // Enables submit button on register page
    async function jsEnableRegisterSubmitButton() {
        var first_name = document.getElementById('id_first_name').value.trim();
        var last_name = document.getElementById('id_last_name').value.trim();
        var submitButton = document.getElementById('submit_button');

        // Initially disable submit to ensure button is disabled while promises are in progress
        submitButton.disabled = true;

        // Create an array of promises with labels
        var labeledPromises = [
            { label: 'Username Validation', promise: jsUsernameValidation() },
            /* DISABLED TEMPORARILY
            { label: 'Email Validation', promise: jsEmailValidation() },
            */
            { label: 'Password Check', promise: jsPasswordValidation() },
            { label: 'Password Confirmation Check', promise: jsPasswordConfirmationValidation() }
        ];
        console.log(`Running jsEnableRegisterSubmitButton()`)

        Promise.all(labeledPromises.map(labeledPromise => {
            // Add a console.log statement before each promise
            console.log(`Running jsEnableRegisterSubmitButton()... Executing promise: ${labeledPromise.label}`);
    
            return labeledPromise.promise.then(result => {
                // Add a console.log statement after each promise resolves
                console.log(`Running jsEnableRegisterSubmitButton()... Promise (${labeledPromise.label}) resolved with result: ${result}`);
                return { label: labeledPromise.label, result: result };
            });
        }))
            .then((results) => {
                // Log each promise result
                results.forEach(res => {
                    console.log(`Result of ${res.label}: ${res.result}`);
                });
    
                // Check if any of the promises return false
                var allPromisesPassed = results.every(res => res.result === true);
                
                if (!allPromisesPassed || first_name === '' || last_name === "" ) {
                    submitButton.disabled = true;
                    console.log(`Running jsEnableRegisterSubmitButton()... Submit button disabled.`);
                } else {
                    // All validations passed
                    console.log(`Running jsEnableRegisterSubmitButton()... All validation checks passed, enabling submit button.`);
                    submitButton.disabled = false;
                }
            }).catch((error) => {
                // Handle errors if any of the Promises reject
                console.error(`Running jsEnableRegisterSubmitButton()... Error is: ${error}.`);
                submitButton.disabled = true;
            });
    }


    // Enables submit button on sell page
    function jsEnableSellSubmitButton() {
        var symbol = document.getElementById('id_symbol').value.trim();
        var submitButton = document.getElementById('submit_button');
        console.log(`running jsEnableSellSubmitButton ... sharesValidationPassed is: ${sharesValidationPassed}`);
        console.log(`running jsEnableSellSubmitButton ... symbol is: ${symbol}`);

        // Initially disable submit to ensure button is disabled while promises are in progress
        submitButton.disabled = true;

        if (symbol != '' && sharesValidationPassed) {
            console.log('Enabling submit button.');
            submitButton.disabled = false;
        } else {
            console.log('Disabling submit button due to failed or incomplete validation.');
            submitButton.disabled = true;
        }
    }
    
});
