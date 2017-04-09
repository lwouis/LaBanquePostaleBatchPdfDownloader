// ==UserScript==
// @name         LaBanquePostaleBatchPdfDownloader
// @namespace    com.lwouis
// @version      1.1
// @description  Once manually logged on LBP's website, the script will show a button to download all PDFs related to operations on your account. The button will be located in "Consulter vos e-relevés" > "Historique de mes relevés". The script does what's already possible through the UI, but downloads everything with one click instead of manual labor.
// @updateURL    https://github.com/lwouis/LaBanquePostaleBatchPdfDownloader/raw/master/LaBanquePostaleBatchPdfDownloader.user.js
// @downloadURL  https://github.com/lwouis/LaBanquePostaleBatchPdfDownloader/raw/master/LaBanquePostaleBatchPdfDownloader.user.js
// @match        https://voscomptesenligne.labanquepostale.fr/voscomptes/canalXHTML/relevePdf/relevePdf_historique/reinitialiser-historiqueRelevesPDF.ea
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    var input = addBatchDownloadButton();
    input.addEventListener('click', function (e) {
        e.preventDefault();
        var select = document.getElementById("numeroCompteRecherche");
        var accountId = select.options[select.selectedIndex].value;
        var currentYear = new Date().getFullYear();
        downloadAllPdfForThatYear(accountId, currentYear);
    }, false);

    function addBatchDownloadButton() {
        var ul = document.getElementsByClassName("actions")[0];
        var li = document.createElement("li");
        li.classList.add('btn');
        li.classList.add('med');
        var input = document.createElement("input");
        input.classList.add('btn');
        input.type = "submit";
        input.value = "Batch download";
        li.appendChild(input);
        ul.insertBefore(li, ul.childNodes[ul.childNodes.length]);
        return input;
    }

    function downloadAllPdfForThatYear(accountId, currentYear) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://voscomptesenligne.labanquepostale.fr/voscomptes/canalXHTML/relevePdf/relevePdf_historique/form-historiqueRelevesPDF.ea?formulaire.numeroCompteRecherche=" + accountId + "&formulaire.anneeRecherche=" + currentYear + "&formulaire.moisRecherche=",
            onload: function (response) {
                var downloadLinksRegex = /"(preparerTelechargementPDF[^"]*)"/g;
                var matches = [];
                var match;
                while (match = downloadLinksRegex.exec(response.responseText)) {
                    matches.push(match[1]);
                }
                if (matches.length > 0) {
                    downloadNextPdf(accountId, matches, 0, currentYear);
                }
            }
        });
    }

    function downloadNextPdf(accountId, matches, i, currentYear) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://voscomptesenligne.labanquepostale.fr/voscomptes/canalXHTML/relevePdf/relevePdf_historique/" + matches[i],
            onload: function () {
                var form = document.createElement("form");
                form.action = "https://voscomptesenligne.labanquepostale.fr/voscomptes/canalXHTML/relevePdf/relevePdf_historique/telechargerPDF-historiqueRelevesPDF.ea";
                form.target = "_blank";
                document.body.appendChild(form);
                form.submit();
                window.setTimeout(function () {
                    if (i + 1 < matches.length) {
                        downloadNextPdf(accountId, matches, i + 1, currentYear);
                    }
                    else {
                        downloadAllPdfForThatYear(accountId, currentYear - 1);
                    }
                }, 2000);
            }
        });
    }
})();