/**
 * Created by james on 08/03/2016.
 */

$(function(){
    var global_socket = io();
    var wb = $(".wb");

    var wb_nsp = $("#url_slug").val();

    global_socket.on('wb-event', function(data) {
        if (data.wb === wb_nsp || data.wb === "global") wb.trigger("new-wb-event", [data]);
    });

    global_socket.on('wb-server-io-external-upsert', function(data) {
        if (data === wb_nsp) location.reload();
    });

    global_socket.emit('wb_nsp', { wb_nsp: wb_nsp});
    global_socket.on('acc', function (data) {
        var socket = io('/' + data.wb_nsp);

        socket.emit("wb-client-get-edit-status");

        wb.on("edit", function() {
            socket.emit("wb-client-edit", socket.id);
        });

        wb.on("saved", function() {
            socket.emit("wb-client-save", socket.id);
        });
        
        socket.on("wb-server-io-status", function(data) {
            if (data.status && data.client !== socket.id) {
                wb.trigger("new-status-message", ["Edit in progress..."]);
                wb.trigger("read-only");
            }
        });

        socket.on("wb-server-io-event", function(data) {
            if (data.type === "edit") {
                if (data.client !== socket.id) {
                    wb.trigger("new-status-message", ["Edit in progress..."]);
                    wb.trigger("read-only");
                }
            } else if (data.type === "save") {
                if (data.client !== socket.id) {
                    wb.trigger("new-status-message", ["Edit finished. Reloading..."]);
                }
                location.reload();
            } else if (data.type === "editor-quit") {
                wb.trigger("new-status-message", ["Edit aborted. Reloading..."]);
                location.reload();
            }
        });
    });

    global_socket.on("disconnect", function() {
        wb.trigger("new-status-message", ["Server down, waiting for reconnect..."]);
        wb.trigger("read-only");
        var connected = false;
        retryConnect();

        function retryConnect() {
            setTimeout(function() {
                $.get("/ping", function(data) {
                    if(!connected) {
                        location.reload();
                    }
                });
                retryConnect();
            }, 3000);
        }
    });


});