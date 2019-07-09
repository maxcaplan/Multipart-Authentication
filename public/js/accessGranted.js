// Page Elements
var delUser = null;

// data variables
var username = null;


/*~~~~~~~~~~~~~~~*/
/*    StartUp    */
/*~~~~~~~~~~~~~~~*/


function startup() {
    // Initializing page element
    delUser = $("#delUser");
    username = window.localStorage.getItem("username");
    window.localStorage.removeItem("username");

    // Adding onClick functionality to the deletion button
    delUser.click( function(ev) {
        var retVal = prompt("Confirm deletion by entering your name (Note you will not be able to retrieve this data upon completion of deleting process), please enter your name:", "JohnDoe");
        if(retVal === username) {
            console.log("Proceeding with account deletion");
            delAccount();
        }
        else if (retVal !== username) {
            console.log("The account name you entered does not match the account you signed in as. Cancelling deletion process.");
            window.alert("The account name you entered does not match the account you signed in as. Cancelling deletion process.");
        }
        else {
            console.log("Account deletion cancelled");
        }
        ev.preventDefault();
    });


    /*~~~~~~~~~~~~~~~*/
    /*   Functions   */
    /*~~~~~~~~~~~~~~~*/


    function delAccount() {
        $.ajax({
            url: '/api/deleteUser',
            type: 'POST',
            data: {
                username: username
            }
        });
        window.alert("The account specified has successfully been deleted from the database");
        location.assign('/')
    }
}

window.addEventListener('load', startup, false);