jQuery.noConflict();
document.getElementById('dataset-upload-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    var formData = new FormData(this);
	

    fetch(this.action, {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data.success) {
            // Check if bullet is present in the response
            if (data && data.bullet) {
                // Redirect to the datascape page using the bullet as an identifier
                window.location.replace('/datascape/' + data.bullet);
            } else {
                console.log("An error occurred: Bullet ID is missing in the response.");
            }
        } else {
            console.log(data.message || "Failed to upload datascape.");
        }
    })
    .catch(function(error) {
        console.error("Error:", error);
    });
});


// Call this somethings that is triggered when upload page is loaded

$(document).ready(function(){
    
    // Globals
    var user         = window.globaData.user;
    var focusEntity  = window.globaData.focusEntity;
    var path         = location.pathname;
    var columnTypes  = [];
    var file         = null;
    
    $("#save-datascape-button").attr('disabled', true);

    // Setup rradio buttons
    $("#privacy-public").click(function(event){
	$("#user-select *").attr('disabled', true);
	$("#add-user").attr('disabled', true);
    });
    
    $("#privacy-self-public").click(function(event){
	$("#user-select *").attr('disabled', true);
	$("#add-user").attr('disabled', true);
    });

    $("#privacy-private").click(function(event){
	$("#user-select *").attr('disabled', false);
	$("#add-user").attr('disabled', false);
    });

    function setTitle(datascapeTitle){
	$('#file-title').val( datascapeTitle );
    }
    
    
    function isId(data, index){	
	// Applying null to all of data will pupulate all empty fields with undefined
	// This will allow map to operate on each field. Otherwise, the field will be 
	// skipped by map
	var column = Array.apply(null, data).map(function(row){ return row[ index ]; });
		
	// Remove first row
	column.shift()
	return Array.apply( null, column).reduce(function(predicate, value, i, self){
	    return ( predicate && value !== undefined && self.indexOf( value ) === i )
	    || ( predicate && i === column.length -1) ;
	}, true);
    }
    
    function isAxis(data, index){
	var column = Array.apply(null, data).map(function(row){ return row[ index ]; });
	
	// Remove first row
	column.shift()
	return Array.apply( null, column).reduce(function(predicate, value, i, self){
	    return ( predicate && value !== undefined && !isNaN( parseFloat( value ) ) )
		|| ( predicate && i === column.length -1) ; // Last row can get funky, ignore it
	}, true);
    }
    
    function setCaption(datascapeCaption){
	var caption   = $("#caption");	


	// For more TinyMCE settings, look here 
	// https://www.tinymce.com/docs/demo/basic-example/
	var settings  = {
	    
	    selector: 'textarea',
	    height: 250,
	    plugins: [
		'advlist autolink lists link image charmap print preview anchor',
		'searchreplace visualblocks code fullscreen',
		'insertdatetime media table contextmenu paste code'
	    ],
	    toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
	    content_css: [
		//'//fast.fonts.net/cssapi/e6dc9b99-64fe-4292-ad98-6974f93cd2a2.css'
		//'//www.tinymce.com/css/codepen.min.css'
	    ]
	};

	// Load content first
	caption.val( datascapeCaption);
	
	// Activate TinyMCE
	tinymce.init( settings );
    }
    
    
    function setSharingArea(visibility, sharedWith){

	var sharingCollection  = $("#shared-user-collection");
	var addUser            = $("#add-user");
	var privacySettings    = $('input:radio[name=privacySettings]');

	sharedWith = sharedWith ? sharedWith : [] ;
	
	// Select user defined default privacy settings
	// Reminder the string stored in `visibility` must 
	// match one of the possible radio values. 
	//	console.log( visibility );

	function addSharedUser(sharedUser){
	    if( !$("#dataset-upload-form").valid() ) return;
	    
	    var userEmailSettings = {
		type: "email",
		value: sharedUser,
		name: "email[]",
		class: "share-with-email",
		placeholder: "Recipient email"
	    };
	    var removeEmailSettings = { 
		class: "pure-button fa fa-trash-o fa-2x remove-email"
	    };	
	    var emailContainerSettings = {	
		class: "email-list-container"
	    };
	    
	    // create list element, remove button, and input field 
	    var userEmail      = $("<input\>",  userEmailSettings);	    
	    var removeEmail    = $("<button\>", removeEmailSettings);
	    var emailContainer = $("<li\>",     emailContainerSettings);

	    // Make field required
	    userEmail.prop('required', true);
	    
	    // Add remove button and feature
	    emailContainer.append(removeEmail);	    
	    emailContainer.append(userEmail);
	    
	    // Create `Remove` functionality
	    removeEmail.click(function(){
		emailContainer.remove();
	    });
	    
	    sharingCollection.append( emailContainer );
	    
	    return false
	}
	

	// Make sure to add users and then disable elements
	// Make sure only see user emails
	// in the backend other things besides users can be on the shared list
	var usersSharedWith = sharedWith.filter(function(obj){ return typeof obj === 'string' || myVar instanceof String});
	usersSharedWith.forEach( addSharedUser );	
	
	if( visibility === 'PUBLIC') {
	    // Public 
	    $("#user-select *").attr('disabled', true);
	    $("#add-user").attr('disabled', true);
	    $("#privacy-public").prop('checked', true );

	} else if( visibility === 'PRIVATE' && usersSharedWith.length === 0 ){
	    //Private and shared with no one
	    $("#user-select *").attr('disabled', true);
	    $("#add-user").attr('disabled', true);
	    $("#privacy-self-private").prop('checked', true );

	} else {
	    // Private but shared publicly 
	    $("#privacy-private").prop('checked', true );

	}
	
	// // Onclick method to add new email field
	addUser.click( function(event){
	    addSharedUser();
	});
    }

	
	function genTable(data, settings) {
		var tableConfig = {
			id: "data-display-table",
			class: "pure-table pure-table-horizontal"
		};
	
		var tableContainer = $("#table-display-container");
	
		var theadConfig = {};
		var tbodyConfig = {};
		
		var table = $("<table>", tableConfig);
		var thead = $("<thead>", theadConfig);
		var tbody = $("<tbody>", tbodyConfig);
	
		// Construct table header
		var trHead = $("<tr>");
		data[0].forEach(function(datum) {
			trHead.append($("<th>", { html: datum }));
		});
		thead.append(trHead);
	
		// Prepare settings for existing column types, if provided
		settings = settings || {};
		settings.columnTypes = settings.columnTypes || [];
	
		// Display a preview of the first 3 rows
		for (var i = 1; i < 4; i++) {
			var tr = $("<tr>");
			data[i].forEach(function(datum) {
				tr.append($("<td>", { html: datum }));
			});
			tbody.append(tr);
		}
	
		// Row for column selection using dropdowns
		var trEvalAs = $("<tr>", { class: 'eval-as' });
	
		data[0].forEach(function(datum, index) {
			var sID = 'eval-column-' + index + '-as';
			
			// Create dropdown as a select element
			var select = $("<select>", { name: "column-eval-type[]", id: sID, class: "column-dropdown" });
	
			// Check if the column is numeric
			var isColumnNumeric = isNumericColumn(data, index);
	
			// Dropdown options
			select.append($("<option>", { value: 'id', html: 'ID', disabled: !isColumnNumeric }));
			select.append($("<option>", { value: 'axis', html: 'Axis', disabled: !isColumnNumeric }));
			select.append($("<option>", { value: 'meta', html: 'Meta' }));
			select.append($("<option>", { value: 'omit', html: 'Omit' }));
	
			// Set initial value from settings if available
			if (settings.columnTypes[index]) {
				select.val(settings.columnTypes[index]);
			} else {
				select.val("omit"); // Default selection to 'omit' if not specified
			}
	
			// Initialize the column type selection array
			columnTypes[index] = select.val();
	
			// Change event listener to update and log the selected value
			select.change(function() {
				columnTypes[index] = this.value;
				console.log("Updated column types:", columnTypes);
			});
	
			// Append the dropdown to the row
			trEvalAs.append($("<td>").append(select));
		});
	
		tbody.append(trEvalAs);
		table.append(thead);
		table.append(tbody);
	
		// Clear any previous table and display the new one
		tableContainer.empty();
		tableContainer.append(table);
	
		// Log the initial column types
		console.log("Initial column types:", columnTypes);
	}
	
	// Helper function to determine if a column is numeric
	function isNumericColumn(data, columnIndex) {
		// Check the first few rows to see if they are numeric
		for (var i = 1; i < Math.min(4, data.length); i++) { // Checking the first three rows
			var value = data[i][columnIndex];
			if (value === undefined || isNaN(parseFloat(value))) {
				return false;
			}
		}
		return true;
	}
	

	
	// Helper function to determine if a column is numeric
	function isNumericColumn(data, columnIndex) {
		// Check the first few rows to see if they are numeric
		for (var i = 1; i < Math.min(4, data.length); i++) { // Checking the first three rows
			var value = data[i][columnIndex];
			if (value === undefined || isNaN(parseFloat(value))) {
				return false;
			}
		}
		return true;
	}
	
	
	
    
    // @fileContainer and @CSV are overrides form the default data
    function populateForm(table, file, fileContainer, CSV){
	if( table.errors.length ) return console.log( table.errors );
	
	// Get the container for the new elements
	var formContainer   = $("#form-file-settings-container")
	var tableContainer  = $("#table-display-container");
	
	console.log(file );
	// Create layout with title and table
	setTitle( file.name.replace(/.csv/, "")  );
	
	// Create table
	tableContainer.append( genTable(table.data ) );
	
	// Insert caption
	setCaption();

	// Use users default visibility 
        setSharingArea( user.fileSettings.defaults.visibility );
    }


    $.validator.prototype.checkForm = function () {
		
        //overriden in a specific page
        this.prepareForm();
        for (var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++) {
            if (this.findByName(elements[i].name).length != undefined
		&& this.findByName(elements[i].name).length > 1) {
                for (var cnt = 0; cnt < this.findByName(elements[i].name).length; cnt++) {
                    this.check(this.findByName(elements[i].name)[cnt]);
                }
            } else {
                this.check(elements[i]);
            }
        }
        return this.valid();
    }
    
    // Form validation
    $("#dataset-upload-form").validate({
	ignore: [],
	rules: {
	    'email[]': { 
		required: true,
	    }
	},
	messages: {
	    'email[]': 'Required'
	},
	submitHandler: function(form) {
    	    var form      = $("#dataset-upload-form");
    	    var formData  = new FormData();	
	    var actionURL = form.attr('action');
	    var method    = form.attr('method').toUpperCase();
            var title     = form.find('input[name="title"]').val();

	    var data = {
		displaySettings: {
		    title: title,
		    caption: tinymce.activeEditor.getContent({format : 'raw'}),	    
		    display: {
			columnTypes: columnTypes
		    },
		    visibility: $('input:radio[name="privacySettings"]:checked').val()
		},
		
		sharedWith: $('input[name^="email[]"]').map(function(){ return $(this).val();}).get()
	    };
	    
	    // I hate to do this but I don't know how else to send objects
	    formData.append( 'revertUponArival', JSON.stringify( data ) );
	    formData.append( 'file', file);
	    $.ajax({
	    	url: actionURL,
	    	type: method,
	    	data: formData,
	    	cache: false,
	    	contentType: false,
	    	processData: false,
	    }).done(function(response, textStatus) {
	        if (response && response.bullet) {
	            window.location.replace('/datascape/' + response.bullet);
	        } else {
	            console.error("Bullet ID missing in response:", response);
	        }
	    });
	}
    });
   
    $("#file-select").change(function (e){
	if( !e.target.files ) return null;
	
	file = e.target.files[0];
	
	Papa.parse( file, {
	    complete: function(parsedObj){
		populateForm( parsedObj, file );
		$("#form-file-settings-container").fadeIn('slow').attr('hidden', false);
		$("#save-datascape-button").attr('disabled', false);
	    }
	});
    });
    
    // If true, than we are on the settings page.
    // The settings page does not have an file select button.
    if( focusEntity._id ){
	
	// Data is the id of the fileContainer 
	// we are looking for.
	var data = {
	    id: focusEntity._id
	}
	
	//Get fileContainer
	// We may have the ability to store the fileContainer 
	// in `focusEntity`, but we also want to hide the emails and 
	// other information it contains.

	async.parallel(
	    [
		function(seriesCB){
		    
		    $.ajax({
			url: '/api/datascapes',
			type: 'GET',
			dataType:'json',	
			cache: false,
			data: data,
			error: seriesCB
		    }).done(function(data){
			
			// Let the CB do its things
			seriesCB(null, data); 			
			
			// populate form data
			setTitle( data.displaySettings.title  );
			
			// // Insert caption
			setCaption( data.displaySettings.caption );
			setSharingArea( data.displaySettings.visibility, data.sharedWith );
			
		    });
		},
		
		function(seriesCB){
		    
		    $.ajax({
			url: '/api/datascapes/source/',
			type: 'GET',
			dataType:'text',	
			cache: false,
			data: data,
			error: seriesCB
		    }).done(function(data){
			// populate form data
			seriesCB(null, data);
		    });
		}
	    ],
	    function(err, results){
		if( err ) return ; // Do something to handle error
		
		// results[0] => FileContainer
		// results[1] => CSV
		
		// Create table
		Papa.parse( results[1], {
		    complete: function(parsedObj){		
			genTable( parsedObj.data, results[0].displaySettings.display );
			$("#form-file-settings-container").fadeIn('slow').attr('hidden', false);
			$("#save-datascape-button").attr('disabled', false);
		    }
		});	
	    });
    }
});

