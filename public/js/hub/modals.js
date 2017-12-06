(function ($) {
    $(function () {

        // Submit the insertion of a new part
        $('#submit-import-part').click((event) => {
            event.preventDefault();
            var cible = third_column.$data.selected;
            if(cible !== "Select a node"){
                var nodeId = $('.selected-accordion').attr('id');
                if (document.getElementById('import-part-file3D').files[0]) {
                    var form = document.getElementById("form-import-part");
                    var formdata = new FormData(form);
                    var postRequest = new XMLHttpRequest();
                    var chips = $('#tags-import-part').material_chip('data');

                    formdata.append("tags", JSON.stringify(chips));
                    postRequest.addEventListener("progress", updateProgress, false);
                    postRequest.addEventListener("load", transferComplete, false);
                    postRequest.addEventListener("error", transferFailed, false);
                    postRequest.addEventListener("abort", transferCanceled, false);

                    postRequest.open('POST', '/part/' + nodeId, true);
                    postRequest.send(formdata);
                    $("#import-part").modal("close");
                } else
                Materialize.toast("You must add a 3d File", 1000);
            }
            else
            Materialize.toast("You must select a node", 1000);
        });

        // Submit the insert of
        $('#submit-import-assembly').click(event => {
            event.preventDefault();
            var cible = third_column.$data.selected;
            if(cible !== "Select a node"){
                if (document.getElementById('import_assembly_file3d').files[0]) {
                    var nodeId = $('.selected-accordion').attr('id');
                    var form = document.getElementById("form-import-assembly");
                    var formdata = new FormData(form);
                    var postRequest = new XMLHttpRequest();
                    var chips = $('#tags-import-part').material_chip('data');

                    formdata.append("tags", JSON.stringify(chips));
                    postRequest.addEventListener("progress", updateProgress, false);
                    postRequest.addEventListener("load", transferComplete, false);
                    postRequest.addEventListener("error", transferFailed, false);
                    postRequest.addEventListener("abort", transferCanceled, false);

                    postRequest.open('POST', '/assembly/' + nodeId, true);
                    postRequest.send(formdata);
                    $("#import-part").modal("close");
                } else
                    Materialize.toast("You must add a 3d File", 1000);
            }
            else
            Materialize.toast("You must select a node", 1000);
        })

        $('.modal-node-selector').click((event) => {
            if (third_column.$data.selected == "Select a node"){
                Materialize.toast("You must select a node", 2000);
                $('.button-form-validate').addClass("disabled");
            } else $('.button-form-validate').removeClass("disabled");
        });

    });
})(jQuery); // end of jQuery name space

const sendTheFile = (file, nodeId) => {
    var reader = new FileReader();
    /*
    var slice = 100000;
    var i = 0;
    var fragment;
    var place;
    */
    reader.readAsArrayBuffer(file);
    reader.onload = (event) => {
        var arrayBuffer = reader.result;
        socket.emit('writeStream', nodeId, {
            name: file.name,
            type: file.type,
            size: file.size,
            data: arrayBuffer
        });
    }

    /*
    while(file.size > i * slice) {
        place = i*slice;
        fragment = file.slice(place, place + Math.min(100000, file.size - place))
        reader.readAsArrayBuffer(fragment);
        i++;
    }
    */

}

const updateProgress = (reqEvent) => {
    console.log("Progress of the transfert");
    if (reqEvent.lengthComputable) {
        var percentComplete = reqEvent.loaded / reqEvent.total;
        console.log(percentComplete+'%');
        // ...
    } else {
        // Impossible de calculer la progression puisque la taille totale est inconnue
    }
},
transferComplete = () => {
    console.log("End of the transfert");
},
transferFailed = () => {
    console.log("Failure of the transfert");
},
transferCanceled = () => {
    console.log("Cancel of the transfert");
}