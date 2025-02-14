(function (a) {
    elFinder = function (d, g) {
        var b = this,
            h;
        this.log = function (i) {
            window.console && window.console.log && window.console.log(i)
        };
        this.options = a.extend({}, this.options, g || {});
        if (!this.options.url) {
            alert("Invalid configuration! You have to set URL option.");
            return
        }
        this.id = "";
        if ((h = a(d).attr("id"))) {
            this.id = h
        } else {}
        this.version = "1.2";
        this.jquery = a.fn.jquery.split(".").join("");
        this.cwd = {};
        this.cdc = {};
        this.buffer = {};
        this.selected = [];
        this.history = [];
        this.locked = false;
        this.zIndex = 2;
        this.dialog = null;
        this.anchor = this.options.docked ? a("<div/>").hide().insertBefore(d) : null;
        this.params = {
            dotFiles: false,
            arc: "",
            uplMaxSize: ""
        };
        this.vCookie = "el-finder-view-" + this.id;
        this.pCookie = "el-finder-places-" + this.id;
        this.lCookie = "el-finder-last-" + this.id;
        this.view = new this.view(this, d);
        this.ui = new this.ui(this);
        this.eventsManager = new this.eventsManager(this);
        this.quickLook = new this.quickLook(this);
        this.cookie = function (j, l) {
            if (typeof l == "undefined") {
                if (document.cookie && document.cookie != "") {
                    var k, p = document.cookie.split(";");
                    j += "=";
                    for (k = 0; k < p.length; k++) {
                        p[k] = a.trim(p[k]);
                        if (p[k].substring(0, j.length) == j) {
                            return decodeURIComponent(p[k].substring(j.length))
                        }
                    }
                }
                return ""
            } else {
                var n, m = a.extend({}, this.options.cookie);
                if (l === null) {
                    l = "";
                    m.expires = -1
                }
                if (typeof (m.expires) == "number") {
                    n = new Date();
                    n.setTime(n.getTime() + (m.expires * 24 * 60 * 60 * 1000));
                    m.expires = n
                }
                document.cookie = j + "=" + encodeURIComponent(l) + "; expires=" + m.expires.toUTCString() + (m.path ? "; path=" + m.path : "") + (m.domain ? "; domain=" + m.domain : "") + (m.secure ? "; secure" : "")
            }
        };
        this.lock = function (i) {
            this.view.spinner((this.locked = i || false));
            this.eventsManager.lock = this.locked
        };
        this.lockShortcuts = function (i) {
            this.eventsManager.lock = !!i
        };
        this.setView = function (i) {
            if (i == "list" || i == "icons") {
                this.options.view = i;
                this.cookie(this.vCookie, i)
            }
        };
        this.ajax = function (k, l, i) {
            var j = {
                url: this.options.url,
                async: true,
                type: "GET",
                data: k,
                dataType: "json",
                cache: false,
                lock: true,
                force: false,
                silent: false
            };
            if (typeof (i) == "object") {
                j = a.extend({}, j, i)
            }
            if (!j.silent) {
                j.error = b.view.fatal
            }
            j.success = function (m) {
                j.lock && b.lock();
                if (m) {
                    m.debug && b.log(m.debug);
                    if (m.error) {
                        !j.silent && b.view.error(m.error, m.errorData);
                        if (!j.force) {
                            return
                        }
                    }
                    l(m);
                    delete m
                }
            };
            j.lock && this.lock(true);
            a.ajax(j)
        };
        this.tmb = function () {
            this.ajax({
                cmd: "tmb",
                current: b.cwd.hash
            }, function (k) {
                if (b.options.view == "icons" && k.images && k.current == b.cwd.hash) {
                    for (var j in k.images) {
                        if (b.cdc[j]) {
                            b.cdc[j].tmb = k.images[j];
                            a('div[key="' + j + '"]>p', b.view.cwd).css("background", ' url("' + k.images[j] + '") 0 0 no-repeat')
                        }
                    }
                    k.tmb && b.tmb()
                }
            }, {
                lock: false,
                silent: true
            })
        };
        this.getPlaces = function () {
            var i = [],
                j = this.cookie(this.pCookie);
            if (j.length) {
                if (j.indexOf(":") != -1) {
                    i = j.split(":")
                } else {
                    i.push(j)
                }
            }
            return i
        };
        this.addPlace = function (j) {
            var i = this.getPlaces();
            if (a.inArray(j, i) == -1) {
                i.push(j);
                this.savePlaces(i);
                return true
            }
        };
        this.removePlace = function (j) {
            var i = this.getPlaces();
            if (a.inArray(j, i) != -1) {
                this.savePlaces(a.map(i, function (k) {
                    return k == j ? null : k
                }));
                return true
            }
        };
        this.savePlaces = function (i) {
            this.cookie(this.pCookie, i.join(":"))
        };
        this.reload = function (m) {
            var k;
            this.cwd = m.cwd;
            this.cdc = {};
            for (k = 0; k < m.cdc.length; k++) {
                if (m.cdc[k].hash && m.cdc[k].name) {
                    this.cdc[m.cdc[k].hash] = m.cdc[k];
                    this.cwd.size += m.cdc[k].size
                }
            }
            if (m.tree) {
                this.view.renderNav(m.tree);
                this.eventsManager.updateNav()
            }
            this.updateCwd();
            if (m.tmb && !b.locked && b.options.view == "icons") {
                b.tmb()
            }
            if (m.select && m.select.length) {
                var j = m.select.length;
                while (j--) {
                    this.cdc[m.select[j]] && this.selectById(m.select[j])
                }
            }
            this.lastDir(this.cwd.hash);
            if (this.options.autoReload > 0) {
                this.iID && clearInterval(this.iID);
                this.iID = setInterval(function () {
                    !b.locked && b.ui.exec("reload")
                }, this.options.autoReload * 60000)
            }
        };
        this.updateCwd = function () {
            this.lockShortcuts(true);
            this.selected = [];
            this.view.renderCwd();
            this.eventsManager.updateCwd();
            this.view.tree.find('a[key="' + this.cwd.hash + '"]').trigger("select");
            this.lockShortcuts()
        };
        this.drop = function (l, j, k) {
            if (j.helper.find('[key="' + k + '"]').length) {
                return b.view.error("Unable to copy into itself")
            }
            var i = [];
            j.helper.find('div:not(.noaccess):has(>label):not(:has(em[class="readonly"],em[class=""]))').each(function () {
                i.push(a(this).hide().attr("key"))
            });
            if (!j.helper.find("div:has(>label):visible").length) {
                j.helper.hide()
            }
            if (i.length) {
                b.setBuffer(i, l.shiftKey ? 0 : 1, k);
                if (b.buffer.files) {
                    setTimeout(function () {
                        b.ui.exec("paste");
                        b.buffer = {}
                    }, 300)
                }
            } else {
                a(this).removeClass("el-finder-droppable")
            }
        };
        this.getSelected = function (j) {
            var k, l = [];
            if (j >= 0) {
                return this.cdc[this.selected[j]] || {}
            }
            for (k = 0; k < this.selected.length; k++) {
                this.cdc[this.selected[k]] && l.push(this.cdc[this.selected[k]])
            }
            return l
        };
        this.select = function (i, j) {
            j && a(".ui-selected", b.view.cwd).removeClass("ui-selected");
            i.addClass("ui-selected");
            b.updateSelect()
        };
        this.selectById = function (j) {
            var i = a('[key="' + j + '"]', this.view.cwd);
            if (i.length) {
                this.select(i);
                this.checkSelectedPos()
            }
        };
        this.unselect = function (i) {
            i.removeClass("ui-selected");
            b.updateSelect()
        };
        this.toggleSelect = function (i) {
            i.toggleClass("ui-selected");
            this.updateSelect()
        };
        this.selectAll = function () {
            a("[key]", b.view.cwd).addClass("ui-selected");
            b.updateSelect()
        };
        this.unselectAll = function () {
            a(".ui-selected", b.view.cwd).removeClass("ui-selected");
            b.updateSelect()
        };
        this.updateSelect = function () {
            b.selected = [];
            a(".ui-selected", b.view.cwd).each(function () {
                b.selected.push(a(this).attr("key"))
            });
            b.view.selectedInfo();
            b.ui.update();
            b.quickLook.update()
        };
        this.checkSelectedPos = function (k) {
            var j = b.view.cwd.find(".ui-selected:" + (k ? "last" : "first")).eq(0),
                l = j.position(),
                i = j.outerHeight(),
                m = b.view.cwd.height();
            if (l.top < 0) {
                b.view.cwd.scrollTop(l.top + b.view.cwd.scrollTop() - 2)
            } else {
                if (m - l.top < i) {
                    b.view.cwd.scrollTop(l.top + i - m + b.view.cwd.scrollTop())
                }
            }
        };
        this.setBuffer = function (k, m, o) {
            var j, n, l;
            this.buffer = {
                src: this.cwd.hash,
                dst: o,
                files: [],
                names: [],
                cut: m || 0
            };
            for (j = 0; j < k.length; j++) {
                n = k[j];
                l = this.cdc[n];
                if (l && l.read && l.type != "link") {
                    this.buffer.files.push(l.hash);
                    this.buffer.names.push(l.name)
                }
            }
            if (!this.buffer.files.length) {
                this.buffer = {}
            }
        };
        this.isValidName = function (i) {
            if (!this.cwd.dotFiles && i.indexOf(".") == 0) {
                return false
            }
            return i.match(/^[^\\\/\<\>:]+$/)
        };
        this.fileExists = function (k) {
            for (var j in this.cdc) {
                if (this.cdc[j].name == k) {
                    return j
                }
            }
            return false
        };
        this.uniqueName = function (m, l) {
            m = b.i18n(m);
            var j = m,
                k = 0,
                l = l || "";
            if (!this.fileExists(j + l)) {
                return j + l
            }
            while (k++ < 100) {
                if (!this.fileExists(j + k + l)) {
                    return j + k + l
                }
            }
            return j.replace("100", "") + Math.random() + l
        };
        this.lastDir = function (i) {
            if (this.options.rememberLastDir) {
                return i ? this.cookie(this.lCookie, i) : this.cookie(this.lCookie)
            }
        };

        function c(i, j) {
            i && b.view.win.width(i);
            j && b.view.nav.add(b.view.cwd).height(j)
        }

        function e() {
            c(null, b.dialog.height() - b.view.tlb.parent().height() - (a.browser.msie ? 47 : 32))
        }
        this.time = function () {
            return new Date().getMilliseconds()
        };
        this.setView(this.cookie(this.vCookie));
        c(b.options.width, b.options.height);
        if (this.options.dialog || this.options.docked) {
            this.options.dialog = a.extend({
                width: 570,
                dialogClass: "",
                minWidth: 480,
                minHeight: 330
            }, this.options.dialog || {});
            this.options.dialog.open = function () {
                setTimeout(function () {
                    a('<input type="text" value="f"/>').appendTo(b.view.win).focus().select().remove()
                }, 200)
            };
            this.options.dialog.dialogClass += "el-finder-dialog";
            this.options.dialog.resize = e;
            if (this.options.docked) {
                this.options.dialog.close = function () {
                    b.dock()
                };
                this.view.win.data("size", {
                    width: this.view.win.width(),
                    height: this.view.nav.height()
                })
            } else {
                this.options.dialog.close = function () {
                    b.destroy()
                };
                this.dialog = a("<div/>").append(this.view.win).dialog(this.options.dialog)
            }
        }
        this.ajax({
            cmd: "open",
            target: this.lastDir() || "",
            init: true,
            tree: true
        }, function (i) {
            if (i.cwd) {
                b.eventsManager.init();
                b.reload(i);
                a.extend(b.params, i.params || {});
                a("*", document.body).each(function () {
                    var j = parseInt(a(this).css("z-index"));
                    if (j >= b.zIndex) {
                        b.zIndex = j + 1
                    }
                });
                b.ui.init(i.disabled)
            }
        }, {
            force: true
        });
        this.open = function () {
            this.dialog ? this.dialog.dialog("open") : this.view.win.show();
            this.eventsManager.lock = false
        };
        this.close = function () {
            this.quickLook.hide();
            if (this.options.docked && this.view.win.attr("undocked")) {
                this.dock()
            } else {
                this.dialog ? this.dialog.dialog("close") : this.view.win.hide()
            }
            this.eventsManager.lock = true
        };
        this.destroy = function () {
            this.eventsManager.lock = true;
            this.quickLook.hide();
            this.quickLook.win.remove();
            if (this.dialog) {
                this.dialog.dialog("destroy");
                this.view.win.parent().remove()
            } else {
                this.view.win.remove()
            }
            this.ui.menu.remove()
        };
        this.dock = function () {
            if (this.options.docked && this.view.win.attr("undocked")) {
                this.quickLook.hide();
                var i = this.view.win.data("size");
                this.view.win.insertAfter(this.anchor).removeAttr("undocked");
                c(i.width, i.height);
                this.dialog.dialog("destroy");
                this.dialog = null
            }
        };
        this.undock = function () {
            if (this.options.docked && !this.view.win.attr("undocked")) {
                this.quickLook.hide();
                this.dialog = a("<div/>").append(this.view.win.css("width", "100%").attr("undocked", true).show()).dialog(this.options.dialog);
                e()
            }
        }
    };
    elFinder.prototype.i18n = function (b) {
        return this.options.i18n[this.options.lang] && this.options.i18n[this.options.lang][b] ? this.options.i18n[this.options.lang][b] : b
    };
    elFinder.prototype.options = {
        url: "",
        lang: "en",
        cssClass: "",
        wrap: 14,
        places: "Places",
        placesFirst: true,
        editorCallback: null,
        cutURL: "",
        closeOnEditorCallback: true,
        i18n: {},
        view: "icons",
        width: "",
        height: "",
        disableShortcuts: false,
        rememberLastDir: true,
        cookie: {
            expires: 30,
            domain: "",
            path: "/",
            secure: false
        },
        toolbar: [
            ["back", "reload"],
            ["select", "open"],
            ["mkdir", "mkfile", "upload"],
            ["copy", "paste", "rm"],
            ["rename", "edit"],
            ["info", "quicklook", "resize"],
            ["icons", "list"],
            ["help"]
        ],
        contextmenu: {
            cwd: ["reload", "delim", "mkdir", "mkfile", "upload", "delim", "paste", "delim", "info"],
            file: ["select", "open", "quicklook", "delim", "copy", "cut", "rm", "delim", "duplicate", "rename", "edit", "resize", "archive", "extract", "delim", "info"],
            group: ["select", "copy", "cut", "rm", "delim", "archive", "extract", "delim", "info"]
        },
        dialog: null,
        docked: false,
        autoReload: 0,
        selectMultiple: false
    };
    a.fn.elfinder = function (b) {
        return this.each(function () {
            var c = typeof (b) == "string" ? b : "";
            if (!this.elfinder) {
                this.elfinder = new elFinder(this, typeof (b) == "object" ? b : {})
            }
            switch (c) {
            case "close":
            case "hide":
                this.elfinder.close();
                break;
            case "open":
            case "show":
                this.elfinder.open();
                break;
            case "dock":
                this.elfinder.dock();
                break;
            case "undock":
                this.elfinder.undock();
                break;
            case "destroy":
                this.elfinder.destroy();
                break
            }
        })
    }
})(jQuery);
(function (a) {
    elFinder.prototype.view = function (d, c) {
        var b = this;
        this.fm = d;
        this.kinds = {
            unknown: "Unknown",
            directory: "Folder",
            symlink: "Alias",
            "symlink-broken": "Broken alias",
            "application/x-empty": "Plain text",
            "application/postscript": "Postscript document",
            "application/octet-stream": "Application",
            "application/vnd.ms-office": "Microsoft Office document",
            "application/vnd.ms-word": "Microsoft Word document",
            "application/vnd.ms-excel": "Microsoft Excel document",
            "application/vnd.ms-powerpoint": "Microsoft Powerpoint presentation",
            "application/pdf": "Portable Document Format (PDF)",
            "application/vnd.oasis.opendocument.text": "Open Office document",
            "application/x-shockwave-flash": "Flash application",
            "application/xml": "XML document",
            "application/x-bittorrent": "Bittorrent file",
            "application/x-7z-compressed": "7z archive",
            "application/x-tar": "TAR archive",
            "application/x-gzip": "GZIP archive",
            "application/x-bzip2": "BZIP archive",
            "application/zip": "ZIP archive",
            "application/x-rar": "RAR archive",
            "application/javascript": "Javascript application",
            "text/plain": "Plain text",
            "text/x-php": "PHP source",
            "text/html": "HTML document",
            "text/javascript": "Javascript source",
            "text/css": "CSS style sheet",
            "text/rtf": "Rich Text Format (RTF)",
            "text/rtfd": "RTF with attachments (RTFD)",
            "text/x-c": "C source",
            "text/x-c++": "C++ source",
            "text/x-shellscript": "Unix shell script",
            "text/x-python": "Python source",
            "text/x-java": "Java source",
            "text/x-ruby": "Ruby source",
            "text/x-perl": "Perl script",
            "text/xml": "XML document",
            "image/x-ms-bmp": "BMP image",
            "image/jpeg": "JPEG image",
            "image/gif": "GIF Image",
            "image/png": "PNG image",
            "image/x-targa": "TGA image",
            "image/tiff": "TIFF image",
            "image/vnd.adobe.photoshop": "Adobe Photoshop image",
            "audio/mpeg": "MPEG audio",
            "audio/midi": "MIDI audio",
            "audio/ogg": "Ogg Vorbis audio",
            "audio/mp4": "MP4 audio",
            "audio/wav": "WAV audio",
            "video/x-dv": "DV video",
            "video/mp4": "MP4 video",
            "video/mpeg": "MPEG video",
            "video/x-msvideo": "AVI video",
            "video/quicktime": "Quicktime video",
            "video/x-ms-wmv": "WM video",
            "video/x-flv": "Flash video",
            "video/x-matroska": "Matroska video"
        };
        this.tlb = a("<ul />");
        this.nav = a('<div class="el-finder-nav"/>').resizable({
            handles: "e",
            autoHide: true,
            minWidth: 200,
            maxWidth: 500
        });
        this.cwd = a('<div class="el-finder-cwd"/>').attr("unselectable", "on");
        this.spn = a('<div class="el-finder-spinner"/>');
        this.err = a('<p class="el-finder-err"><strong/></p>').click(function () {
            a(this).hide()
        });
        this.nfo = a('<div class="el-finder-stat"/>');
        this.pth = a('<div class="el-finder-path"/>');
        this.sel = a('<div class="el-finder-sel"/>');
        this.stb = a('<div class="el-finder-statusbar"/>').append(this.pth).append(this.nfo).append(this.sel);
        this.wrz = a('<div class="el-finder-workzone" />').append(this.nav).append(this.cwd).append(this.spn).append(this.err).append('<div style="clear:both" />');
        this.win = a(c).empty().attr("id", this.fm.id).addClass("el-finder " + (d.options.cssClass || "")).append(a('<div class="el-finder-toolbar" />').append(this.tlb)).append(this.wrz).append(this.stb);
        this.tree = a('<ul class="el-finder-tree"></ul>').appendTo(this.nav);
        this.plc = a('<ul class="el-finder-places"><li><a href="#" class="el-finder-places-root"><div/>' + this.fm.i18n(this.fm.options.places) + "</a><ul/></li></ul>").hide();
        this.nav[this.fm.options.placesFirst ? "prepend" : "append"](this.plc);
        this.spinner = function (e) {
            this.win.toggleClass("el-finder-disabled", e);
            this.spn.toggle(e)
        };
        this.fatal = function (e) {
            b.error(e.status != "404" ? "Invalid backend configuration" : "Unable to connect to backend")
        };
        this.error = function (e, g) {
            this.fm.lock();
            this.err.show().children("strong").html(this.fm.i18n(e) + "!" + this.formatErrorData(g));
            setTimeout(function () {
                b.err.fadeOut("slow")
            }, 4000)
        };
        this.renderNav = function (g) {
            var i = g.dirs.length ? h(g.dirs) : "",
                e = '<li><a href="#" class="el-finder-tree-root" key="' + g.hash + '"><div' + (i ? ' class="collapsed expanded"' : "") + "/>" + g.name + "</a>" + i + "</li>";
            this.tree.html(e);
            this.fm.options.places && this.renderPlaces();

            function h(j) {
                var l, m, n, k = '<ul style="display:none">';
                for (l = 0; l < j.length; l++) {
                    if (!j[l].name || !j[l].hash) {
                        continue
                    }
                    n = "";
                    if (!j[l].read && !j[l].write) {
                        n = "noaccess"
                    } else {
                        if (!j[l].read) {
                            n = "dropbox"
                        } else {
                            if (!j[l].write) {
                                n = "readonly"
                            }
                        }
                    }
                    k += '<li><a href="#" class="' + n + '" key="' + j[l].hash + '"><div' + (j[l].dirs.length ? ' class="collapsed"' : "") + "/>" + j[l].name + "</a>";
                    if (j[l].dirs.length) {
                        k += h(j[l].dirs)
                    }
                    k += "</li>"
                }
                return k + "</ul>"
            }
        };
        this.renderPlaces = function () {
            var g, j, h = this.fm.getPlaces(),
                e = this.plc.show().find("ul").empty().hide();
            a("div:first", this.plc).removeClass("collapsed expanded");
            if (h.length) {
                h.sort(function (k, i) {
                    var m = b.tree.find('a[key="' + k + '"]').text() || "",
                        l = b.tree.find('a[key="' + i + '"]').text() || "";
                    return m.localeCompare(l)
                });
                for (g = 0; g < h.length; g++) {
                    if ((j = this.tree.find('a[key="' + h[g] + '"]:not(.dropbox)').parent()) && j.length) {
                        e.append(j.clone().children("ul").remove().end().find("div").removeClass("collapsed expanded").end())
                    } else {
                        this.fm.removePlace(h[g])
                    }
                }
                e.children().length && a("div:first", this.plc).addClass("collapsed")
            }
        };
        this.renderCwd = function () {
            this.cwd.empty();
            var e = 0,
                h = 0,
                g = "";
            for (var i in this.fm.cdc) {
                e++;
                h += this.fm.cdc[i].size;
                g += this.fm.options.view == "icons" ? this.renderIcon(this.fm.cdc[i]) : this.renderRow(this.fm.cdc[i], e % 2)
            }
            if (this.fm.options.view == "icons") {
                this.cwd.append(g)
            } else {
                this.cwd.append('<table><tr><th colspan="2">' + this.fm.i18n("Name") + "</th><th>" + this.fm.i18n("Permissions") + "</th><th>" + this.fm.i18n("Modified") + '</th><th class="size">' + this.fm.i18n("Size") + "</th><th>" + this.fm.i18n("Kind") + "</th></tr>" + g + "</table>")
            }
            this.pth.text(d.cwd.rel);
            this.nfo.text(d.i18n("items") + ": " + e + ", " + this.formatSize(h));
            this.sel.empty()
        };
        this.renderIcon = function (e) {
            var g = "<p" + (e.tmb ? " style=\"background:url('" + e.tmb + "') 0 0 no-repeat\"" : "") + "/><label>" + this.formatName(e.name) + "</label>";
            if (e.link || e.mime == "symlink-broken") {
                g += "<em/>"
            }
            if (!e.read && !e.write) {
                g += '<em class="noaccess"/>'
            } else {
                if (e.read && !e.write) {
                    g += '<em class="readonly"/>'
                } else {
                    if (!e.read && e.write) {
                        g += '<em class="' + (e.mime == "directory" ? "dropbox" : "noread") + '" />'
                    }
                }
            }
            return '<div class="' + this.mime2class(e.mime) + '" key="' + e.hash + '">' + g + "</div>"
        };
        this.renderRow = function (g, e) {
            var h = g.link || g.mime == "symlink-broken" ? "<em/>" : "";
            if (!g.read && !g.write) {
                h += '<em class="noaccess"/>'
            } else {
                if (g.read && !g.write) {
                    h += '<em class="readonly"/>'
                } else {
                    if (!g.read && g.write) {
                        h += '<em class="' + (g.mime == "directory" ? "dropbox" : "noread") + '" />'
                    }
                }
            }
            return '<tr key="' + g.hash + '" class="' + b.mime2class(g.mime) + (e ? " el-finder-row-odd" : "") + '"><td class="icon"><p>' + h + "</p></td><td>" + g.name + "</td><td>" + b.formatPermissions(g.read, g.write, g.rm) + "</td><td>" + b.formatDate(g.date) + '</td><td class="size">' + b.formatSize(g.size) + "</td><td>" + b.mime2kind(g.link ? "symlink" : g.mime) + "</td></tr>"
        };
        this.updateFile = function (g) {
            var h = this.cwd.find('[key="' + g.hash + '"]');
            h.replaceWith(h[0].nodeName == "DIV" ? this.renderIcon(g) : this.renderRow(g))
        };
        this.selectedInfo = function () {
            var e, g = 0,
                h;
            if (b.fm.selected.length) {
                h = this.fm.getSelected();
                for (e = 0; e < h.length; e++) {
                    g += h[e].size
                }
            }
            this.sel.text(e > 0 ? this.fm.i18n("selected items") + ": " + h.length + ", " + this.formatSize(g) : "")
        };
        this.formatName = function (g) {
            var e = b.fm.options.wrap;
            if (e > 0) {
                if (g.length > e * 2) {
                    return g.substr(0, e) + "&shy;" + g.substr(e, e - 5) + "&hellip;" + g.substr(g.length - 3)
                } else {
                    if (g.length > e) {
                        return g.substr(0, e) + "&shy;" + g.substr(e)
                    }
                }
            }
            return g
        };
        this.formatErrorData = function (h) {
            var e, g = "";
            if (typeof (h) == "object") {
                g = "<br />";
                for (e in h) {
                    g += e + " " + b.fm.i18n(h[e]) + "<br />"
                }
            }
            return g
        };
        this.mime2class = function (e) {
            return e.replace("/", " ").replace(/\./g, "-")
        };
        this.formatDate = function (e) {
            return e.replace(/([a-z]+)\s/i, function (h, g) {
                return b.fm.i18n(g) + " "
            })
        };
        this.formatSize = function (g) {
            var h = 1,
                e = "bytes";
            if (g > 1073741824) {
                h = 1073741824;
                e = "Gb"
            } else {
                if (g > 1048576) {
                    h = 1048576;
                    e = "Mb"
                } else {
                    if (g > 1024) {
                        h = 1024;
                        e = "Kb"
                    }
                }
            }
            return Math.round(g / h) + " " + e
        };
        this.formatPermissions = function (g, e, i) {
            var h = [];
            g && h.push(b.fm.i18n("read"));
            e && h.push(b.fm.i18n("write"));
            i && h.push(b.fm.i18n("remove"));
            return h.join("/")
        };
        this.mime2kind = function (e) {
            return this.fm.i18n(this.kinds[e] || "unknown")
        }
    }
})(jQuery);
(function (a) {
    elFinder.prototype.ui = function (c) {
        var b = this;
        this.fm = c;
        this.cmd = {};
        this.buttons = {};
        this.menu = a('<div class="el-finder-contextmenu" />').appendTo(document.body).hide();
        this.dockButton = a('<div class="el-finder-dock-button" title="' + b.fm.i18n("Dock/undock filemanager window") + '" />');
        this.exec = function (e, d) {
            if (this.cmd[e]) {
                if (e != "open" && !this.cmd[e].isAllowed()) {
                    return this.fm.view.error("Command not allowed")
                }
                if (!this.fm.locked) {
                    this.fm.quickLook.hide();
                    a(".el-finder-info").remove();
                    this.cmd[e].exec(d);
                    this.update()
                }
            }
        };
        this.cmdName = function (d) {
            if (this.cmd[d] && this.cmd[d].name) {
                return d == "archive" && this.fm.params.archives.length == 1 ? this.fm.i18n("Create") + " " + this.fm.view.mime2kind(this.fm.params.archives[0]).toLowerCase() : this.fm.i18n(this.cmd[d].name)
            }
            return d
        };
        this.isCmdAllowed = function (d) {
            return b.cmd[d] && b.cmd[d].isAllowed()
        };
        this.execIfAllowed = function (d) {
            this.isCmdAllowed(d) && this.exec(d)
        };
        this.includeInCm = function (e, d) {
            return this.isCmdAllowed(e) && this.cmd[e].cm(d)
        };
        this.showMenu = function (i) {
            var g, h, d, k = "";
            this.hideMenu();
            if (!b.fm.selected.length) {
                g = "cwd"
            } else {
                if (b.fm.selected.length == 1) {
                    g = "file"
                } else {
                    g = "group"
                }
            }
            j(g);
            h = a(window);
            d = {
                height: h.height(),
                width: h.width(),
                sT: h.scrollTop(),
                cW: this.menu.width(),
                cH: this.menu.height()
            };
            this.menu.css({
                left: ((i.clientX + d.cW) > d.width ? (i.clientX - d.cW) : i.clientX),
                top: ((i.clientY + d.cH) > d.height && i.clientY > d.cH ? (i.clientY + d.sT - d.cH) : i.clientY + d.sT)
            }).show().find("div[name]").hover(function () {
                var l = a(this),
                    m = l.children("div"),
                    e;
                l.addClass("hover");
                if (m.length) {
                    if (!m.attr("pos")) {
                        e = l.outerWidth();
                        m.css(a(window).width() - e - l.offset().left > m.width() ? "left" : "right", e - 5).attr("pos", true)
                    }
                    m.show()
                }
            }, function () {
                a(this).removeClass("hover").children("div").hide()
            }).click(function (m) {
                m.stopPropagation();
                var l = a(this);
                if (!l.children("div").length) {
                    b.hideMenu();
                    b.exec(l.attr("name"), l.attr("argc"))
                }
            });

            function j(q) {
                var p, n, m, o, e, r = b.fm.options.contextmenu[q] || [];
                for (p = 0; p < r.length; p++) {
                    if (r[p] == "delim") {
                        b.menu.children().length && !b.menu.children(":last").hasClass("delim") && b.menu.append('<div class="delim" />')
                    } else {
                        if (b.fm.ui.includeInCm(r[p], q)) {
                            m = b.cmd[r[p]].argc();
                            o = "";
                            if (m.length) {
                                o = '<span/><div class="el-finder-contextmenu-sub" style="z-index:' + (parseInt(b.menu.css("z-index")) + 1) + '">';
                                for (var n = 0; n < m.length; n++) {
                                    o += '<div name="' + r[p] + '" argc="' + m[n].argc + '" class="' + m[n]["class"] + '">' + m[n].text + "</div>"
                                }
                                o += "</div>"
                            }
                            b.menu.append('<div class="' + r[p] + '" name="' + r[p] + '">' + o + b.cmdName(r[p]) + "</div>")
                        }
                    }
                }
            }
        };
        this.hideMenu = function () {
            this.menu.hide().empty()
        };
        this.update = function () {
            for (var d in this.buttons) {
                this.buttons[d].toggleClass("disabled", !this.cmd[d].isAllowed())
            }
        };
        this.init = function (k) {
            var h, d, o, m = false,
                g = 2,
                l, e = this.fm.options.toolbar;
            if (!this.fm.options.editorCallback) {
                k.push("select")
            }
            if (!this.fm.params.archives.length && a.inArray("archive", k) == -1) {
                k.push("archive")
            }
            for (h in this.commands) {
                if (a.inArray(h, k) == -1) {
                    this.commands[h].prototype = this.command.prototype;
                    this.cmd[h] = new this.commands[h](this.fm)
                }
            }
            for (h = 0; h < e.length; h++) {
                if (m) {
                    this.fm.view.tlb.append('<li class="delim" />')
                }
                m = false;
                for (d = 0; d < e[h].length; d++) {
                    o = e[h][d];
                    if (this.cmd[o]) {
                        m = true;
                        this.buttons[o] = a('<li class="' + o + '" title="' + this.cmdName(o) + '" name="' + o + '" />').appendTo(this.fm.view.tlb).click(function (i) {
                            i.stopPropagation()
                        }).bind("click", (function (i) {
                            return function () {
                                !a(this).hasClass("disabled") && i.exec(a(this).attr("name"))
                            }
                        })(this)).hover(function () {
                            !a(this).hasClass("disabled") && a(this).addClass("el-finder-tb-hover")
                        }, function () {
                            a(this).removeClass("el-finder-tb-hover")
                        })
                    }
                }
            }
            this.update();
            this.menu.css("z-index", this.fm.zIndex);
            if (this.fm.options.docked) {
                this.dockButton.hover(function () {
                    a(this).addClass("el-finder-dock-button-hover")
                }, function () {
                    a(this).removeClass("el-finder-dock-button-hover")
                }).click(function () {
                    b.fm.view.win.attr("undocked") ? b.fm.dock() : b.fm.undock();
                    a(this).trigger("mouseout")
                }).prependTo(this.fm.view.tlb)
            }
        }
    };
    elFinder.prototype.ui.prototype.command = function (b) {};
    elFinder.prototype.ui.prototype.command.prototype.isAllowed = function () {
        return true
    };
    elFinder.prototype.ui.prototype.command.prototype.cm = function (b) {
        return false
    };
    elFinder.prototype.ui.prototype.command.prototype.argc = function (b) {
        return []
    };
    elFinder.prototype.ui.prototype.commands = {
        back: function (c) {
            var b = this;
            this.name = "Back";
            this.fm = c;
            this.exec = function () {
                if (this.fm.history.length) {
                    this.fm.ajax({
                        cmd: "open",
                        target: this.fm.history.pop()
                    }, function (d) {
                        b.fm.reload(d)
                    })
                }
            };
            this.isAllowed = function () {
                return this.fm.history.length
            }
        },
        reload: function (c) {
            var b = this;
            this.name = "Reload";
            this.fm = c;
            this.exec = function () {
                this.fm.ajax({
                    cmd: "open",
                    target: this.fm.cwd.hash,
                    tree: true
                }, function (d) {
                    b.fm.reload(d)
                })
            };
            this.cm = function (d) {
                return d == "cwd"
            }
        },
        open: function (c) {
            var b = this;
            this.name = "Open";
            this.fm = c;
            this.exec = function (e) {
                var g = null;
                if (e) {
                    g = {
                        hash: a(e).attr("key"),
                        mime: "directory",
                        read: !a(e).hasClass("noaccess") && !a(e).hasClass("dropbox")
                    }
                } else {
                    g = this.fm.getSelected(0)
                } if (!g.hash) {
                    return
                }
                if (!g.read) {
                    return this.fm.view.error("Access denied")
                }
                if (g.type == "link" && !g.link) {
                    return this.fm.view.error("Unable to open broken link")
                }
                if (g.mime == "directory") {
                    h(g.link || g.hash)
                } else {
                    d(g)
                }

                function h(i) {
                    b.fm.history.push(b.fm.cwd.hash);
                    b.fm.ajax({
                        cmd: "open",
                        target: i
                    }, function (j) {
                        b.fm.reload(j)
                    })
                }

                function d(k) {
                    var j, i = "";
                    if (k.dim) {
                        j = k.dim.split("x");
                        i = "width=" + (parseInt(j[0]) + 20) + ",height=" + (parseInt(j[1]) + 20) + ","
                    }
                    window.open(k.url || b.fm.options.url + "?cmd=open&current=" + (k.parent || b.fm.cwd.hash) + "&target=" + (k.link || k.hash), false, "top=50,left=50," + i + "scrollbars=yes,resizable=yes")
                }
            };
            this.isAllowed = function () {
                return this.fm.selected.length == 1 && this.fm.getSelected(0).read
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        select: function (b) {
            this.name = "Select file";
            this.fm = b;
            if (b.options.selectMultiple) {
                this.exec = function () {
                    var c = a(b.getSelected()).map(function () {
                        return b.options.cutURL == "root" ? this.url.substr(b.params.url.length) : this.url.replace(new RegExp("^(" + b.options.cutURL + ")"), "")
                    });
                    b.options.editorCallback(c);
                    if (b.options.closeOnEditorCallback) {
                        b.dock();
                        b.close()
                    }
                }
            } else {
                this.exec = function () {
                    var c = this.fm.getSelected(0);
                    if (!c.url) {
                        return this.fm.view.error("File URL disabled by connector config")
                    }
                    this.fm.options.editorCallback(this.fm.options.cutURL == "root" ? c.url.substr(this.fm.params.url.length) : c.url.replace(new RegExp("^(" + this.fm.options.cutURL + ")"), ""));
                    if (this.fm.options.closeOnEditorCallback) {
                        this.fm.dock();
                        this.fm.close();
                        this.fm.destroy()
                    }
                }
            }
            this.isAllowed = function () {
                return ((this.fm.options.selectMultiple && this.fm.selected.length >= 1) || this.fm.selected.length == 1) && !/(symlink\-broken|directory)/.test(this.fm.getSelected(0).mime)
            };
            this.cm = function (c) {
                return c != "cwd"
            }
        },
        quicklook: function (c) {
            var b = this;
            this.name = "Preview with Quick Look";
            this.fm = c;
            this.exec = function () {
                b.fm.quickLook.toggle()
            };
            this.isAllowed = function () {
                return this.fm.selected.length == 1
            };
            this.cm = function () {
                return true
            }
        },
        info: function (c) {
            var b = this;
            this.name = "Get info";
            this.fm = c;
            this.exec = function () {
                var j, i, e = this.fm.selected.length,
                    d = a(window).width(),
                    g = a(window).height();
                this.fm.lockShortcuts(true);
                if (!e) {
                    k(b.fm.cwd)
                } else {
                    a.each(this.fm.getSelected(), function () {
                        k(this)
                    })
                }

                function k(m) {
                    var n = ["50%", "50%"],
                        h, q, o, l = '<table cellspacing="0"><tr><td>' + b.fm.i18n("Name") + "</td><td>" + m.name + "</td></tr><tr><td>" + b.fm.i18n("Kind") + "</td><td>" + b.fm.view.mime2kind(m.link ? "symlink" : m.mime) + "</td></tr><tr><td>" + b.fm.i18n("Size") + "</td><td>" + b.fm.view.formatSize(m.size) + "</td></tr><tr><td>" + b.fm.i18n("Modified") + "</td><td>" + b.fm.view.formatDate(m.date) + "</td></tr><tr><td>" + b.fm.i18n("Permissions") + "</td><td>" + b.fm.view.formatPermissions(m.read, m.write, m.rm) + "</td></tr>";
                    if (m.link) {
                        l += "<tr><td>" + b.fm.i18n("Link to") + "</td><td>" + m.linkTo + "</td></tr>"
                    }
                    if (m.dim) {
                        l += "<tr><td>" + b.fm.i18n("Dimensions") + "</td><td>" + m.dim + " px.</td></tr>"
                    }
                    if (m.url) {
                        l += "<tr><td>" + b.fm.i18n("URL") + '</td><td><a href="' + m.url + '" target="_blank">' + m.url + "</a></td></tr>"
                    }
                    if (e > 1) {
                        o = a(".el-finder-dialog-info:last");
                        if (!o.length) {
                            h = Math.round(((d - 350) / 2) - (e * 10));
                            q = Math.round(((g - 300) / 2) - (e * 10));
                            n = [h > 20 ? h : 20, q > 20 ? q : 20]
                        } else {
                            h = o.offset().left + 10;
                            q = o.offset().top + 10;
                            n = [h < d - 350 ? h : 20, q < g - 300 ? q : 20]
                        }
                    }
                    a("<div />").append(l + "</table>").dialog({
                        dialogClass: "el-finder-dialog el-finder-dialog-info",
                        width: 390,
                        position: n,
                        title: b.fm.i18n(m.mime == "directory" ? "Folder info" : "File info"),
                        close: function () {
                            if (--e <= 0) {
                                b.fm.lockShortcuts()
                            }
                            a(this).dialog("destroy")
                        },
                        buttons: {
                            Ok: function () {
                                a(this).dialog("close")
                            }
                        }
                    })
                }
            };
            this.cm = function (d) {
                return true
            }
        },
        rename: function (c) {
            var b = this;
            this.name = "Rename";
            this.fm = c;
            this.exec = function () {
                var i = this.fm.getSelected(),
                    h, l, e, j, k;
                if (i.length == 1) {
                    j = i[0];
                    h = this.fm.view.cwd.find('[key="' + j.hash + '"]');
                    l = this.fm.options.view == "icons" ? h.children("label") : h.find("td").eq(1);
                    k = l.html();
                    e = a('<input type="text" />').val(j.name).appendTo(l.empty()).bind("change blur", d).keydown(function (m) {
                        m.stopPropagation();
                        if (m.keyCode == 27) {
                            g()
                        } else {
                            if (m.keyCode == 13) {
                                if (j.name == e.val()) {
                                    g()
                                } else {
                                    a(this).trigger("change")
                                }
                            }
                        }
                    }).click(function (m) {
                        m.stopPropagation()
                    }).select().focus();
                    this.fm.lockShortcuts(true)
                }

                function g() {
                    l.html(k);
                    b.fm.lockShortcuts()
                }

                function d() {
                    if (!b.fm.locked) {
                        var n, m = e.val();
                        if (j.name == e.val()) {
                            return g()
                        }
                        if (!b.fm.isValidName(m)) {
                            n = "Invalid name"
                        } else {
                            if (b.fm.fileExists(m)) {
                                n = "File or folder with the same name already exists"
                            }
                        } if (n) {
                            b.fm.view.error(n);
                            h.addClass("ui-selected");
                            b.fm.lockShortcuts(true);
                            return e.select().focus()
                        }
                        b.fm.ajax({
                            cmd: "rename",
                            current: b.fm.cwd.hash,
                            target: j.hash,
                            name: m
                        }, function (o) {
                            if (o.error) {
                                g()
                            } else {
                                j.mime == "directory" && b.fm.removePlace(j.hash) && b.fm.addPlace(o.target);
                                b.fm.reload(o)
                            }
                        }, {
                            force: true
                        })
                    }
                }
            };
            this.isAllowed = function () {
                return this.fm.cwd.write && this.fm.getSelected(0).write
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        copy: function (b) {
            this.name = "Copy";
            this.fm = b;
            this.exec = function () {
                this.fm.setBuffer(this.fm.selected)
            };
            this.isAllowed = function () {
                if (this.fm.selected.length) {
                    var d = this.fm.getSelected(),
                        c = d.length;
                    while (c--) {
                        if (d[c].read) {
                            return true
                        }
                    }
                }
                return false
            };
            this.cm = function (c) {
                return c != "cwd"
            }
        },
        cut: function (b) {
            this.name = "Cut";
            this.fm = b;
            this.exec = function () {
                this.fm.setBuffer(this.fm.selected, 1)
            };
            this.isAllowed = function () {
                if (this.fm.selected.length) {
                    var d = this.fm.getSelected(),
                        c = d.length;
                    while (c--) {
                        if (d[c].read && d[c].rm) {
                            return true
                        }
                    }
                }
                return false
            };
            this.cm = function (c) {
                return c != "cwd"
            }
        },
        paste: function (c) {
            var b = this;
            this.name = "Paste";
            this.fm = c;
            this.exec = function () {
                var e, l, h, g, k = "";
                if (!this.fm.buffer.dst) {
                    this.fm.buffer.dst = this.fm.cwd.hash
                }
                l = this.fm.view.tree.find('[key="' + this.fm.buffer.dst + '"]');
                if (!l.length || l.hasClass("noaccess") || l.hasClass("readonly")) {
                    return this.fm.view.error("Access denied")
                }
                if (this.fm.buffer.src == this.fm.buffer.dst) {
                    return this.fm.view.error("Unable to copy into itself")
                }
                var j = {
                    cmd: "paste",
                    current: this.fm.cwd.hash,
                    src: this.fm.buffer.src,
                    dst: this.fm.buffer.dst,
                    cut: this.fm.buffer.cut
                };
                if (this.fm.jquery > 132) {
                    j.targets = this.fm.buffer.files
                } else {
                    j["targets[]"] = this.fm.buffer.files
                }
                this.fm.ajax(j, function (d) {
                    d.cdc && b.fm.reload(d)
                }, {
                    force: true
                })
            };
            this.isAllowed = function () {
                return this.fm.buffer.files
            };
            this.cm = function (d) {
                return d == "cwd"
            }
        },
        rm: function (c) {
            var b = this;
            this.name = "Remove";
            this.fm = c;
            this.exec = function () {
                var d, g = [],
                    e = this.fm.getSelected();
                for (var d = 0; d < e.length; d++) {
                    if (!e[d].rm) {
                        return this.fm.view.error(e[d].name + ": " + this.fm.i18n("Access denied"))
                    }
                    g.push(e[d].hash)
                }
                if (g.length) {
                    this.fm.lockShortcuts(true);
                    a('<div><div class="ui-state-error ui-corner-all"><span class="ui-icon ui-icon-alert"/><strong>' + this.fm.i18n("Are you sure you want to remove files?<br /> This cannot be undone!") + "</strong></div></div>").dialog({
                        title: this.fm.i18n("Confirmation required"),
                        dialogClass: "el-finder-dialog",
                        width: 350,
                        close: function () {
                            b.fm.lockShortcuts()
                        },
                        buttons: {
                            Cancel: function () {
                                a(this).dialog("close")
                            },
                            Ok: function () {
                                a(this).dialog("close");
                                var h = {
                                    cmd: "rm",
                                    current: b.fm.cwd.hash
                                };
                                if (b.fm.jquery > 132) {
                                    h.targets = g
                                } else {
                                    h["targets[]"] = g
                                }
                                b.fm.ajax(h, function (i) {
                                    i.tree && b.fm.reload(i)
                                }, {
                                    force: true
                                })
                            }
                        }
                    })
                }
            };
            this.isAllowed = function (g) {
                if (this.fm.selected.length) {
                    var e = this.fm.getSelected(),
                        d = e.length;
                    while (d--) {
                        if (e[d].rm) {
                            return true
                        }
                    }
                }
                return false
            };
            this.cm = function (d) {
                return d != "cwd"
            }
        },
        mkdir: function (c) {
            var b = this;
            this.name = "New folder";
            this.fm = c;
            this.exec = function () {
                b.fm.unselectAll();
                var e = this.fm.uniqueName("untitled folder");
                input = a('<input type="text"/>').val(e);
                prev = this.fm.view.cwd.find(".directory:last");
                f = {
                    name: e,
                    hash: "",
                    mime: "directory",
                    read: true,
                    write: true,
                    date: "",
                    size: 0
                }, el = this.fm.options.view == "list" ? a(this.fm.view.renderRow(f)).children("td").eq(1).empty().append(input).end().end() : a(this.fm.view.renderIcon(f)).children("label").empty().append(input).end();
                el.addClass("directory ui-selected");
                if (prev.length) {
                    el.insertAfter(prev)
                } else {
                    if (this.fm.options.view == "list") {
                        el.insertAfter(this.fm.view.cwd.find("tr").eq(0))
                    } else {
                        el.prependTo(this.fm.view.cwd)
                    }
                }
                b.fm.checkSelectedPos();
                input.select().focus().click(function (g) {
                    g.stopPropagation()
                }).bind("change blur", d).keydown(function (g) {
                    g.stopPropagation();
                    if (g.keyCode == 27) {
                        el.remove();
                        b.fm.lockShortcuts()
                    } else {
                        if (g.keyCode == 13) {
                            d()
                        }
                    }
                });
                b.fm.lockShortcuts(true);

                function d() {
                    if (!b.fm.locked) {
                        var h, g = input.val();
                        if (!b.fm.isValidName(g)) {
                            h = "Invalid name"
                        } else {
                            if (b.fm.fileExists(g)) {
                                h = "File or folder with the same name already exists"
                            }
                        } if (h) {
                            b.fm.view.error(h);
                            b.fm.lockShortcuts(true);
                            el.addClass("ui-selected");
                            return input.select().focus()
                        }
                        b.fm.ajax({
                            cmd: "mkdir",
                            current: b.fm.cwd.hash,
                            name: g
                        }, function (i) {
                            if (i.error) {
                                el.addClass("ui-selected");
                                return input.select().focus()
                            }
                            b.fm.reload(i)
                        }, {
                            force: true
                        })
                    }
                }
            };
            this.isAllowed = function () {
                return this.fm.cwd.write
            };
            this.cm = function (d) {
                return d == "cwd"
            }
        },
        mkfile: function (c) {
            var b = this;
            this.name = "New text file";
            this.fm = c;
            this.exec = function () {
                b.fm.unselectAll();
                var i = this.fm.uniqueName("untitled file", ".txt"),
                    e = a('<input type="text"/>').val(i),
                    h = {
                        name: i,
                        hash: "",
                        mime: "text/plain",
                        read: true,
                        write: true,
                        date: "",
                        size: 0
                    },
                    g = this.fm.options.view == "list" ? a(this.fm.view.renderRow(h)).children("td").eq(1).empty().append(e).end().end() : a(this.fm.view.renderIcon(h)).children("label").empty().append(e).end();
                g.addClass("text ui-selected").appendTo(this.fm.options.view == "list" ? b.fm.view.cwd.children("table") : b.fm.view.cwd);
                e.select().focus().bind("change blur", d).click(function (j) {
                    j.stopPropagation()
                }).keydown(function (j) {
                    j.stopPropagation();
                    if (j.keyCode == 27) {
                        g.remove();
                        b.fm.lockShortcuts()
                    } else {
                        if (j.keyCode == 13) {
                            d()
                        }
                    }
                });
                b.fm.lockShortcuts(true);

                function d() {
                    if (!b.fm.locked) {
                        var k, j = e.val();
                        if (!b.fm.isValidName(j)) {
                            k = "Invalid name"
                        } else {
                            if (b.fm.fileExists(j)) {
                                k = "File or folder with the same name already exists"
                            }
                        } if (k) {
                            b.fm.view.error(k);
                            b.fm.lockShortcuts(true);
                            g.addClass("ui-selected");
                            return e.select().focus()
                        }
                        b.fm.ajax({
                            cmd: "mkfile",
                            current: b.fm.cwd.hash,
                            name: j
                        }, function (l) {
                            if (l.error) {
                                g.addClass("ui-selected");
                                return e.select().focus()
                            }
                            b.fm.reload(l)
                        }, {
                            force: true
                        })
                    }
                }
            };
            this.isAllowed = function (d) {
                return this.fm.cwd.write
            };
            this.cm = function (d) {
                return d == "cwd"
            }
        },
        upload: function (c) {
            var b = this;
            this.name = "Upload files";
            this.fm = c;
            this.exec = function () {
                var g = "el-finder-io-" + (new Date().getTime()),
                    l = a('<div class="ui-state-error ui-corner-all"><span class="ui-icon ui-icon-alert"/><div/></div>'),
                    h = this.fm.params.uplMaxSize ? "<p>" + this.fm.i18n("Maximum allowed files size") + ": " + this.fm.params.uplMaxSize + "</p>" : "",
                    s = a('<p class="el-finder-add-field"><span class="ui-state-default ui-corner-all"><em class="ui-icon ui-icon-circle-plus"/></span>' + this.fm.i18n("Add field") + "</p>").click(function () {
                        a(this).before('<p><input type="file" name="upload[]"/></p>')
                    }),
                    k = '<form method="post" enctype="multipart/form-data" action="' + b.fm.options.url + '" target="' + g + '"><input type="hidden" name="cmd" value="upload" /><input type="hidden" name="current" value="' + b.fm.cwd.hash + '" />',
                    o = a("<div/>"),
                    j = 3;
                while (j--) {
                    k += '<p><input type="file" name="upload[]"/></p>'
                }
                var r = a("meta[name=csrf-token]").attr("content");
                var q = a("meta[name=csrf-param]").attr("content");
                if (q != null && r != null) {
                    k += '<input name="' + q + '" value="' + r + '" type="hidden" />'
                }
                k = a(k + "</form>");
                o.append(k.append(l.hide()).prepend(h).append(s)).dialog({
                    dialogClass: "el-finder-dialog",
                    title: b.fm.i18n("Upload files"),
                    modal: true,
                    resizable: false,
                    close: function () {
                        b.fm.lockShortcuts()
                    },
                    buttons: {
                        Cancel: function () {
                            a(this).dialog("close")
                        },
                        Ok: function () {
                            if (!a(":file[value]", k).length) {
                                return p(b.fm.i18n("Select at least one file to upload"))
                            }
                            setTimeout(function () {
                                b.fm.lock();
                                if (a.browser.safari) {
                                    a.ajax({
                                        url: b.fm.options.url,
                                        data: {
                                            cmd: "ping"
                                        },
                                        error: n,
                                        success: n
                                    })
                                } else {
                                    n()
                                }
                            });
                            a(this).dialog("close")
                        }
                    }
                });
                b.fm.lockShortcuts(true);

                function p(d) {
                    l.show().find("div").empty().text(d)
                }

                function n() {
                    var v = a('<iframe name="' + g + '" name="' + g + '" src="about:blank"/>'),
                        w = v[0],
                        i = 50,
                        u, e, t;
                    v.css({
                        position: "absolute",
                        top: "-1000px",
                        left: "-1000px"
                    }).appendTo("body").bind("load", function () {
                        v.unbind("load");
                        d()
                    });
                    b.fm.lock(true);
                    k.submit();

                    function d() {
                        try {
                            u = w.contentWindow ? w.contentWindow.document : w.contentDocument ? w.contentDocument : w.document;
                            if (u.body == null || u.body.innerHTML == "") {
                                if (--i) {
                                    return setTimeout(d, 100)
                                } else {
                                    m();
                                    return b.fm.view.error("Unable to access iframe DOM after 50 tries")
                                }
                            }
                            e = a(u.body).html();
                            if (b.fm.jquery >= 141) {
                                t = a.parseJSON(e)
                            } else {
                                if (/^[\],:{}\s]*$/.test(e.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                                    t = window.JSON && window.JSON.parse ? window.JSON.parse(e) : (new Function("return " + e))()
                                } else {
                                    t = {
                                        error: "Unable to parse server response"
                                    }
                                }
                            }
                        } catch (x) {
                            t = {
                                error: "Unable to parse server response"
                            }
                        }
                        m();
                        t.error && b.fm.view.error(t.error, t.errorData);
                        t.cwd && b.fm.reload(t);
                        t.tmb && b.fm.tmb()
                    }

                    function m() {
                        b.fm.lock();
                        v.remove()
                    }
                }
            };
            this.isAllowed = function () {
                return this.fm.cwd.write
            };
            this.cm = function (d) {
                return d == "cwd"
            }
        },
        duplicate: function (c) {
            var b = this;
            this.name = "Duplicate";
            this.fm = c;
            this.exec = function () {
                this.fm.ajax({
                    cmd: "duplicate",
                    current: this.fm.cwd.hash,
                    target: this.fm.selected[0]
                }, function (d) {
                    b.fm.reload(d)
                })
            };
            this.isAllowed = function () {
                return this.fm.cwd.write && this.fm.selected.length == 1 && this.fm.getSelected()[0].read
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        edit: function (c) {
            var b = this;
            this.name = "Edit text file";
            this.fm = c;
            this.exec = function () {
                var d = this.fm.getSelected(0);
                this.fm.lockShortcuts(true);
                this.fm.ajax({
                    cmd: "read",
                    current: this.fm.cwd.hash,
                    target: d.hash
                }, function (g) {
                    b.fm.lockShortcuts(true);
                    var e = a("<textarea/>").val(g.content || "").keydown(function (j) {
                        j.stopPropagation();
                        if (j.keyCode == 9) {
                            j.preventDefault();
                            if (a.browser.msie) {
                                var h = document.selection.createRange();
                                h.text = "\t" + h.text;
                                this.focus()
                            } else {
                                var i = this.value.substr(0, this.selectionStart),
                                    k = this.value.substr(this.selectionEnd);
                                this.value = i + "\t" + k;
                                this.setSelectionRange(i.length + 1, i.length + 1)
                            }
                        }
                    });
                    a("<div/>").append(e).dialog({
                        dialogClass: "el-finder-dialog",
                        title: b.fm.i18n(b.name),
                        modal: true,
                        width: 500,
                        close: function () {
                            b.fm.lockShortcuts()
                        },
                        buttons: {
                            Cancel: function () {
                                a(this).dialog("close")
                            },
                            Ok: function () {
                                var h = e.val();
                                a(this).dialog("close");
                                b.fm.ajax({
                                    cmd: "edit",
                                    current: b.fm.cwd.hash,
                                    target: d.hash,
                                    content: h
                                }, function (i) {
                                    if (i.target) {
                                        b.fm.cdc[i.target.hash] = i.target;
                                        b.fm.view.updateFile(i.target);
                                        b.fm.selectById(i.target.hash)
                                    }
                                }, {
                                    type: "POST"
                                })
                            }
                        }
                    })
                })
            };
            this.isAllowed = function () {
                if (b.fm.selected.length == 1) {
                    var d = this.fm.getSelected()[0];
                    return d.write && d.read && (d.mime.indexOf("text") == 0 || d.mime == "application/x-empty" || d.mime == "application/xml")
                }
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        archive: function (c) {
            var b = this;
            this.name = "Create archive";
            this.fm = c;
            this.exec = function (d) {
                var e = {
                    cmd: "archive",
                    current: b.fm.cwd.hash,
                    type: a.inArray(d, this.fm.params.archives) != -1 ? d : this.fm.params.archives[0],
                    name: b.fm.i18n("Archive")
                };
                if (this.fm.jquery > 132) {
                    e.targets = b.fm.selected
                } else {
                    e["targets[]"] = b.fm.selected
                }
                this.fm.ajax(e, function (g) {
                    b.fm.reload(g)
                })
            };
            this.isAllowed = function () {
                if (this.fm.cwd.write && this.fm.selected.length) {
                    var e = this.fm.getSelected(),
                        d = e.length;
                    while (d--) {
                        if (e[d].read) {
                            return true
                        }
                    }
                }
                return false
            };
            this.cm = function (d) {
                return d != "cwd"
            };
            this.argc = function () {
                var e, d = [];
                for (e = 0; e < b.fm.params.archives.length; e++) {
                    d.push({
                        "class": "archive",
                        argc: b.fm.params.archives[e],
                        text: b.fm.view.mime2kind(b.fm.params.archives[e])
                    })
                }
                return d
            }
        },
        extract: function (c) {
            var b = this;
            this.name = "Uncompress archive";
            this.fm = c;
            this.exec = function () {
                this.fm.ajax({
                    cmd: "extract",
                    current: this.fm.cwd.hash,
                    target: this.fm.getSelected(0).hash
                }, function (d) {
                    b.fm.reload(d)
                })
            };
            this.isAllowed = function () {
                var e = this.fm.params.extract,
                    d = e && e.length;
                return this.fm.cwd.write && this.fm.selected.length == 1 && this.fm.getSelected(0).read && d && a.inArray(this.fm.getSelected(0).mime, e) != -1
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        resize: function (c) {
            var b = this;
            this.name = "Resize image";
            this.fm = c;
            this.exec = function () {
                var l = this.fm.getSelected();
                if (l[0] && l[0].write && l[0].dim) {
                    var j = l[0].dim.split("x"),
                        g = parseInt(j[0]),
                        k = parseInt(j[1]),
                        e = g / k;
                    iw = a('<input type="text" size="9" value="' + g + '" name="width"/>'), ih = a('<input type="text" size="9" value="' + k + '" name="height"/>'), f = a("<form/>").append(iw).append(" x ").append(ih).append(" px");
                    iw.add(ih).bind("change", i);
                    b.fm.lockShortcuts(true);
                    var m = a("<div/>").append(a("<div/>").text(b.fm.i18n("Dimensions") + ":")).append(f).dialog({
                        title: b.fm.i18n("Resize image"),
                        dialogClass: "el-finder-dialog",
                        width: 230,
                        modal: true,
                        close: function () {
                            b.fm.lockShortcuts()
                        },
                        buttons: {
                            Cancel: function () {
                                a(this).dialog("close")
                            },
                            Ok: function () {
                                var d = parseInt(iw.val()) || 0,
                                    h = parseInt(ih.val()) || 0;
                                if (d > 0 && d != g && h > 0 && h != k) {
                                    b.fm.ajax({
                                        cmd: "resize",
                                        current: b.fm.cwd.hash,
                                        target: l[0].hash,
                                        width: d,
                                        height: h
                                    }, function (n) {
                                        b.fm.reload(n)
                                    })
                                }
                                a(this).dialog("close")
                            }
                        }
                    })
                }

                function i() {
                    var d = parseInt(iw.val()) || 0,
                        h = parseInt(ih.val()) || 0;
                    if (d <= 0 || h <= 0) {
                        d = g;
                        h = k
                    } else {
                        if (this == iw.get(0)) {
                            h = parseInt(d / e)
                        } else {
                            d = parseInt(h * e)
                        }
                    }
                    iw.val(d);
                    ih.val(h)
                }
            };
            this.isAllowed = function () {
                return this.fm.selected.length == 1 && this.fm.cdc[this.fm.selected[0]].write && this.fm.cdc[this.fm.selected[0]].read && this.fm.cdc[this.fm.selected[0]].resize
            };
            this.cm = function (d) {
                return d == "file"
            }
        },
        icons: function (b) {
            this.name = "View as icons";
            this.fm = b;
            this.exec = function () {
                this.fm.view.win.addClass("el-finder-disabled");
                this.fm.setView("icons");
                this.fm.updateCwd();
                this.fm.view.win.removeClass("el-finder-disabled");
                a("div.image", this.fm.view.cwd).length && this.fm.tmb()
            };
            this.isAllowed = function () {
                return this.fm.options.view != "icons"
            };
            this.cm = function (c) {
                return c == "cwd"
            }
        },
        list: function (b) {
            this.name = "View as list";
            this.fm = b;
            this.exec = function () {
                this.fm.view.win.addClass("el-finder-disabled");
                this.fm.setView("list");
                this.fm.updateCwd();
                this.fm.view.win.removeClass("el-finder-disabled")
            };
            this.isAllowed = function () {
                return this.fm.options.view != "list"
            };
            this.cm = function (c) {
                return c == "cwd"
            }
        },
        help: function (b) {
            this.name = "Help";
            this.fm = b;
            this.exec = function () {
                var j, e = this.fm.i18n("helpText"),
                    c, i, g;
                j = '<div class="el-finder-logo"/><strong>' + this.fm.i18n("elFinder: Web file manager") + "</strong><br/>" + this.fm.i18n("Version") + ": " + this.fm.version + "<br/>jQuery/jQueryUI: " + a().jquery + "/" + a.ui.version + '<br clear="all"/><p><strong><a href="http://elrte.org/' + this.fm.options.lang + '/elfinder" target="_blank">' + this.fm.i18n("Donate to support project development") + '</a></strong></p><p><a href="http://elrte.org/redmine/projects/elfinder/wiki" target="_blank">' + this.fm.i18n("elFinder documentation") + "</a></p>";
                j += "<p>" + (e != "helpText" ? e : "elFinder works similar to file manager on your computer. <br /> To make actions on files/folders use icons on top panel. If icon action it is not clear for you, hold mouse cursor over it to see the hint. <br /> Manipulations with existing files/folders can be done through the context menu (mouse right-click).<br/> To copy/delete a group of files/folders, select them using Shift/Alt(Command) + mouse left-click.") + "</p>";
                j += "<p><strong>" + this.fm.i18n("elFinder support following shortcuts") + ":</strong><ul><li><kbd>Ctrl+A</kbd> - " + this.fm.i18n("Select all files") + "</li><li><kbd>Ctrl+C/Ctrl+X/Ctrl+V</kbd> - " + this.fm.i18n("Copy/Cut/Paste files") + "</li><li><kbd>Enter</kbd> - " + this.fm.i18n("Open selected file/folder") + "</li><li><kbd>Space</kbd> - " + this.fm.i18n("Open/close QuickLook window") + "</li><li><kbd>Delete/Cmd+Backspace</kbd> - " + this.fm.i18n("Remove selected files") + "</li><li><kbd>Ctrl+I</kbd> - " + this.fm.i18n("Selected files or current directory info") + "</li><li><kbd>Ctrl+N</kbd> - " + this.fm.i18n("Create new directory") + "</li><li><kbd>Ctrl+U</kbd> - " + this.fm.i18n("Open upload files form") + "</li><li><kbd>Left arrow</kbd> - " + this.fm.i18n("Select previous file") + "</li><li><kbd>Right arrow </kbd> - " + this.fm.i18n("Select next file") + "</li><li><kbd>Ctrl+Right arrow</kbd> - " + this.fm.i18n("Open selected file/folder") + "</li><li><kbd>Ctrl+Left arrow</kbd> - " + this.fm.i18n("Return into previous folder") + "</li><li><kbd>Shift+arrows</kbd> - " + this.fm.i18n("Increase/decrease files selection") + "</li></ul></p><p>" + this.fm.i18n("Contacts us if you need help integrating elFinder in you products") + ": dev@std42.ru</p>";
                c = '<div class="el-finder-help-std"/><p>' + this.fm.i18n("Javascripts/PHP programming: Dmitry (dio) Levashov, dio@std42.ru") + "</p><p>" + this.fm.i18n("Python programming, techsupport: Troex Nevelin, troex@fury.scancode.ru") + "</p><p>" + this.fm.i18n("Design: Valentin Razumnih") + "</p><p>" + this.fm.i18n("Chezh localization") + ": Roman Matena, info@romanmatena.cz</p><p>" + this.fm.i18n("Chinese (traditional) localization") + ": Tad, tad0616@gmail.com</p><p>" + this.fm.i18n("Dutch localization") + ': Kurt Aerts, <a href="http://ilabsolutions.net/" target="_blank">http://ilabsolutions.net</a></p><p>' + this.fm.i18n("Greek localization") + ": Panagiotis Skarvelis</p><p>" + this.fm.i18n("Hungarian localization") + ": Viktor Tamas, tamas.viktor@totalstudio.hu</p><p>" + this.fm.i18n("Italian localization") + ":  Ugo Punzolo, sadraczerouno@gmail.com</p><p>" + this.fm.i18n("Latvian localization") + ":  Uldis Plotin�, uldis.plotins@gmail.com</p><p>" + this.fm.i18n("Poland localization") + ":  Darek Wapinski, darek@wapinski.us</p><p>" + this.fm.i18n("Spanish localization") + ': Alex (xand) Vavilin, xand@xand.es, <a href="http://xand.es" target="_blank">http://xand.es</a></p><p>' + this.fm.i18n("Icons") + ': <a href="http://pixelmixer.ru/" target="_blank">pixelmixer</a>,  <a href="http://www.famfamfam.com/lab/icons/silk/" target="_blank">Famfam silk icons</a>, <a href="http://www.fatcow.com/free-icons/" target="_blank">Fatcow icons</a></p><p>' + this.fm.i18n('Copyright: <a href="http://www.std42.ru" target="_blank">Studio 42 LTD</a>') + "</p><p>" + this.fm.i18n("License: BSD License") + "</p><p>" + this.fm.i18n('Web site: <a href="http://elrte.org/elfinder/" target="_blank">elrte.org/elfinder</a>') + "</p>";
                i = '<div class="el-finder-logo"/><strong><a href="http://www.eldorado-cms.ru" target="_blank">ELDORADO.CMS</a></strong><br/>' + this.fm.i18n("Simple and usefull Content Management System") + "<hr/>" + this.fm.i18n("Support project development and we will place here info about you");
                g = '<ul><li><a href="#el-finder-help-h">' + this.fm.i18n("Help") + '</a></li><li><a href="#el-finder-help-a">' + this.fm.i18n("Authors") + '</a><li><a href="#el-finder-help-sp">' + this.fm.i18n("Sponsors") + '</a></li></ul><div id="el-finder-help-h"><p>' + j + '</p></div><div id="el-finder-help-a"><p>' + c + '</p></div><div id="el-finder-help-sp"><p>' + i + "</p></div>";
                var k = a("<div/>").html(g).dialog({
                    width: 617,
                    title: this.fm.i18n("Help"),
                    dialogClass: "el-finder-dialog",
                    modal: true,
                    close: function () {
                        k.tabs("destroy").dialog("destroy").remove()
                    },
                    buttons: {
                        Ok: function () {
                            a(this).dialog("close")
                        }
                    }
                }).tabs()
            };
            this.cm = function (c) {
                return c == "cwd"
            }
        }
    }
})(jQuery);
(function (a) {
    elFinder.prototype.quickLook = function (l, b) {
        var p = this;
        this.fm = l;
        this._hash = "";
        this.title = a("<strong/>");
        this.ico = a("<p/>");
        this.info = a("<label/>");
        this.media = a('<div class="el-finder-ql-media"/>').hide();
        this.name = a('<span class="el-finder-ql-name"/>');
        this.kind = a('<span class="el-finder-ql-kind"/>');
        this.size = a('<span class="el-finder-ql-size"/>');
        this.date = a('<span class="el-finder-ql-date"/>');
        this.url = a('<a href="#"/>').hide().click(function (i) {
            i.preventDefault();
            window.open(a(this).attr("href"));
            p.hide()
        });
        this.add = a("<div/>");
        this.content = a('<div class="el-finder-ql-content"/>');
        this.win = a('<div class="el-finder-ql"/>').hide().append(a('<div class="el-finder-ql-drag-handle"/>').append(a('<span class="ui-icon ui-icon-circle-close"/>').click(function () {
            p.hide()
        })).append(this.title)).append(this.ico).append(this.media).append(this.content.append(this.name).append(this.kind).append(this.size).append(this.date).append(this.url).append(this.add)).appendTo("body").draggable({
            handle: ".el-finder-ql-drag-handle"
        }).resizable({
            minWidth: 420,
            minHeight: 150,
            resize: function () {
                if (p.media.children().length) {
                    var m = p.media.children(":first");
                    switch (m[0].nodeName) {
                    case "IMG":
                        var e = m.width(),
                            n = m.height(),
                            i = p.win.width(),
                            s = p.win.css("height") == "auto" ? 350 : p.win.height() - p.content.height() - p.th,
                            q = e > i || n > s ? Math.min(Math.min(i, e) / e, Math.min(s, n) / n) : Math.min(Math.max(i, e) / e, Math.max(s, n) / n);
                        m.css({
                            width: Math.round(m.width() * q),
                            height: Math.round(m.height() * q)
                        });
                        break;
                    case "IFRAME":
                    case "EMBED":
                        m.css("height", p.win.height() - p.content.height() - p.th);
                        break;
                    case "OBJECT":
                        m.children("embed").css("height", p.win.height() - p.content.height() - p.th)
                    }
                }
            }
        });
        this.th = parseInt(this.win.children(":first").css("height")) || 18;
        this.mimes = {
            "image/jpeg": "jpg",
            "image/gif": "gif",
            "image/png": "png"
        };
        for (var h = 0; h < navigator.mimeTypes.length; h++) {
            var o = navigator.mimeTypes[h].type;
            if (o && o != "*") {
                this.mimes[o] = navigator.mimeTypes[h].suffixes
            }
        }
        if ((a.browser.safari && navigator.platform.indexOf("Mac") != -1) || a.browser.msie) {
            this.mimes["application/pdf"] = "pdf"
        } else {
            for (var c = 0; c < navigator.plugins.length; c++) {
                for (var d = 0; d < navigator.plugins[c].length; d++) {
                    var k = navigator.plugins[c][d].description.toLowerCase();
                    if (k.substring(0, k.indexOf(" ")) == "pdf") {
                        this.mimes["application/pdf"] = "pdf";
                        break
                    }
                }
            }
        } if (this.mimes["image/x-bmp"]) {
            this.mimes["image/x-ms-bmp"] = "bmp"
        }
        if (a.browser.msie && !this.mimes["application/x-shockwave-flash"]) {
            this.mimes["application/x-shockwave-flash"] = "swf"
        }
        this.show = function () {
            if (this.win.is(":hidden") && p.fm.selected.length == 1) {
                g();
                var m = p.fm.selected[0],
                    e = p.fm.view.cwd.find('[key="' + m + '"]'),
                    i = e.offset();
                p.fm.lockShortcuts(true);
                this.win.css({
                    width: e.width() - 20,
                    height: e.height(),
                    left: i.left,
                    top: i.top,
                    opacity: 0
                }).show().animate({
                    width: 420,
                    height: 150,
                    opacity: 1,
                    top: Math.round(a(window).height() / 5),
                    left: a(window).width() / 2 - 210
                }, 450, function () {
                    p.win.css({
                        height: "auto"
                    });
                    p.fm.lockShortcuts()
                })
            }
        };
        this.hide = function () {
            if (this.win.is(":visible")) {
                var i, e = p.fm.view.cwd.find('[key="' + this._hash + '"]');
                if (e) {
                    i = e.offset();
                    this.media.hide(200);
                    this.win.animate({
                        width: e.width() - 20,
                        height: e.height(),
                        left: i.left,
                        top: i.top,
                        opacity: 0
                    }, 350, function () {
                        p.fm.lockShortcuts();
                        j();
                        p.win.hide().css("height", "auto")
                    })
                } else {
                    this.win.fadeOut(200);
                    j();
                    p.fm.lockShortcuts()
                }
            }
        };
        this.toggle = function () {
            if (this.win.is(":visible")) {
                this.hide()
            } else {
                this.show()
            }
        };
        this.update = function () {
            if (this.fm.selected.length != 1) {
                this.hide()
            } else {
                if (this.win.is(":visible") && this.fm.selected[0] != this._hash) {
                    g()
                }
            }
        };
        this.mediaHeight = function () {
            return this.win.is(":animated") || this.win.css("height") == "auto" ? 315 : this.win.height() - this.content.height() - this.th
        };

        function j() {
            p.media.hide().empty();
            p.win.attr("class", "el-finder-ql").css("z-index", p.fm.zIndex);
            p.title.empty();
            p.ico.attr("style", "").show();
            p.add.hide().empty();
            p._hash = ""
        }

        function g() {
            var m = p.fm.getSelected(0);
            j();
            p._hash = m.hash;
            p.title.text(m.name);
            p.win.addClass(p.fm.view.mime2class(m.mime));
            p.name.text(m.name);
            p.kind.text(p.fm.view.mime2kind(m.link ? "symlink" : m.mime));
            p.size.text(p.fm.view.formatSize(m.size));
            p.date.text(p.fm.i18n("Modified") + ": " + p.fm.view.formatDate(m.date));
            m.dim && p.add.append("<span>" + m.dim + " px</span>").show();
            m.tmb && p.ico.css("background", 'url("' + m.tmb + '") 0 0 no-repeat');
            if (m.url) {
                p.url.text(m.url).attr("href", m.url).show();
                for (var e in p.plugins) {
                    if (p.plugins[e].test && p.plugins[e].test(m.mime, p.mimes, m.name)) {
                        p.plugins[e].show(p, m);
                        return
                    }
                }
            } else {
                p.url.hide()
            }
            p.win.css({
                width: "420px",
                height: "auto"
            })
        }
    };
    elFinder.prototype.quickLook.prototype.plugins = {
        image: new function () {
            this.test = function (c, b) {
                return c.match(/^image\//)
            };
            this.show = function (e, d) {
                var b, c;
                if (e.mimes[d.mime] && d.hash == e._hash) {
                    a("<img/>").hide().appendTo(e.media.show()).attr("src", d.url + (a.browser.msie || a.browser.opera ? "?" + Math.random() : "")).load(function () {
                        c = a(this).unbind("load");
                        if (d.hash == e._hash) {
                            e.win.is(":animated") ? setTimeout(function () {
                                g(c)
                            }, 330) : g(c)
                        }
                    })
                }

                function g(k) {
                    var j = k.width(),
                        m = k.height(),
                        i = e.win.is(":animated"),
                        l = i ? 420 : e.win.width(),
                        o = i || e.win.css("height") == "auto" ? 315 : e.win.height() - e.content.height() - e.th,
                        n = j > l || m > o ? Math.min(Math.min(l, j) / j, Math.min(o, m) / m) : Math.min(Math.max(l, j) / j, Math.max(o, m) / m);
                    e.fm.lockShortcuts(true);
                    e.ico.hide();
                    k.css({
                        width: e.ico.width(),
                        height: e.ico.height()
                    }).show().animate({
                        width: Math.round(n * j),
                        height: Math.round(n * m)
                    }, 450, function () {
                        e.fm.lockShortcuts()
                    })
                }
            }
        },
        text: new function () {
            this.test = function (c, b) {
                return (c.indexOf("text") == 0 && c.indexOf("rtf") == -1) || c.match(/application\/(xml|javascript|json)/)
            };
            this.show = function (c, b) {
                if (b.hash == c._hash) {
                    c.ico.hide();
                    c.media.append('<iframe src="' + b.url + '" style="height:' + c.mediaHeight() + 'px" />').show()
                }
            }
        },
        swf: new function () {
            this.test = function (c, b) {
                return c == "application/x-shockwave-flash" && b[c]
            };
            this.show = function (c, b) {
                if (b.hash == c._hash) {
                    c.ico.hide();
                    var d = c.media.append('<embed pluginspage="http://www.macromedia.com/go/getflashplayer" quality="high" src="' + b.url + '" style="width:100%;height:' + c.mediaHeight() + 'px" type="application/x-shockwave-flash" />');
                    if (c.win.is(":animated")) {
                        d.slideDown(450)
                    } else {
                        d.show()
                    }
                }
            }
        },
        audio: new function () {
            this.test = function (c, b) {
                return c.indexOf("audio") == 0 && b[c]
            };
            this.show = function (d, c) {
                if (c.hash == d._hash) {
                    d.ico.hide();
                    var b = d.win.is(":animated") || d.win.css("height") == "auto" ? 100 : d.win.height() - d.content.height() - d.th;
                    d.media.append('<embed src="' + c.url + '" style="width:100%;height:' + b + 'px" />').show()
                }
            }
        },
        video: new function () {
            this.test = function (c, b) {
                return c.indexOf("video") == 0 && b[c]
            };
            this.show = function (c, b) {
                if (b.hash == c._hash) {
                    c.ico.hide();
                    c.media.append('<embed src="' + b.url + '" style="width:100%;height:' + c.mediaHeight() + 'px" />').show()
                }
            }
        },
        pdf: new function () {
            this.test = function (c, b) {
                return c == "application/pdf" && b[c]
            };
            this.show = function (c, b) {
                if (b.hash == c._hash) {
                    c.ico.hide();
                    c.media.append('<embed src="' + b.url + '" style="width:100%;height:' + c.mediaHeight() + 'px" />').show()
                }
            }
        }
    }
})(jQuery);
(function (a) {
    elFinder.prototype.eventsManager = function (d, c) {
        var b = this;
        this.lock = false;
        this.fm = d;
        this.ui = d.ui;
        this.tree = d.view.tree;
        this.cwd = d.view.cwd;
        this.pointer = "";
        this.init = function () {
            var g = this,
                h = false;
            g.lock = false;
            this.cwd.bind("click", function (j) {
                var i = a(j.target);
                if (i.hasClass("ui-selected")) {
                    g.fm.unselectAll()
                } else {
                    if (!i.attr("key")) {
                        i = i.parent("[key]")
                    }
                    if (j.ctrlKey || j.metaKey) {
                        g.fm.toggleSelect(i)
                    } else {
                        g.fm.select(i, true)
                    }
                }
            }).bind(window.opera ? "click" : "contextmenu", function (j) {
                if (window.opera && !j.ctrlKey) {
                    return
                }
                j.preventDefault();
                j.stopPropagation();
                var i = a(j.target);
                if (a.browser.mozilla) {
                    h = true
                }
                if (i.hasClass("el-finder-cwd")) {
                    g.fm.unselectAll()
                } else {
                    g.fm.select(i.attr("key") ? i : i.parent("[key]"))
                }
                g.fm.quickLook.hide();
                g.fm.ui.showMenu(j)
            }).selectable({
                filter: "[key]",
                delay: 300,
                stop: function () {
                    g.fm.updateSelect();
                    g.fm.log("mouseup")
                }
            });
            a(document).bind("click", function (i) {
                !h && g.fm.ui.hideMenu();
                h = false;
                a("input", g.cwd).trigger("change");
                if (!a(i.target).is("input,textarea,select")) {
                    a("input,textarea").blur()
                }
            });
            a("input,textarea").live("focus", function (i) {
                g.lock = true
            }).live("blur", function (i) {
                g.lock = false
            });
            this.tree.bind("select", function (i) {
                g.tree.find("a").removeClass("selected");
                a(i.target).addClass("selected").parents("li:has(ul)").children("ul").show().prev().children("div").addClass("expanded")
            });
            if (this.fm.options.places) {
                this.fm.view.plc.click(function (l) {
                    l.preventDefault();
                    var j = a(l.target),
                        k = j.attr("key"),
                        i;
                    if (k) {
                        k != g.fm.cwd.hash && g.ui.exec("open", l.target)
                    } else {
                        if (l.target.nodeName == "A" || l.target.nodeName == "DIV") {
                            i = g.fm.view.plc.find("ul");
                            if (i.children().length) {
                                i.toggle(300);
                                g.fm.view.plc.children("li").find("div").toggleClass("expanded")
                            }
                        }
                    }
                });
                this.fm.view.plc.droppable({
                    accept: "(div,tr).directory",
                    tolerance: "pointer",
                    over: function () {
                        a(this).addClass("el-finder-droppable")
                    },
                    out: function () {
                        a(this).removeClass("el-finder-droppable")
                    },
                    drop: function (k, j) {
                        a(this).removeClass("el-finder-droppable");
                        var i = false;
                        j.helper.children(".directory:not(.noaccess,.dropbox)").each(function () {
                            if (g.fm.addPlace(a(this).attr("key"))) {
                                i = true;
                                a(this).hide()
                            }
                        });
                        if (i) {
                            g.fm.view.renderPlaces();
                            g.updatePlaces();
                            g.fm.view.plc.children("li").children("div").trigger("click")
                        }
                        if (!j.helper.children("div:visible").length) {
                            j.helper.hide()
                        }
                    }
                })
            }
            a(document).bind(a.browser.mozilla || a.browser.opera ? "keypress" : "keydown", function (j) {
                var i = j.ctrlKey || j.metaKey;
                if (g.lock) {
                    return
                }
                switch (j.keyCode) {
                case 37:
                case 38:
                    j.stopPropagation();
                    j.preventDefault();
                    if (j.keyCode == 37 && i) {
                        g.ui.execIfAllowed("back")
                    } else {
                        e(false, !j.shiftKey)
                    }
                    break;
                case 39:
                case 40:
                    j.stopPropagation();
                    j.preventDefault();
                    if (i) {
                        g.ui.execIfAllowed("open")
                    } else {
                        e(true, !j.shiftKey)
                    }
                    break
                }
            });
            a(document).bind(a.browser.opera ? "keypress" : "keydown", function (i) {
                if (g.lock) {
                    return
                }
                switch (i.keyCode) {
                case 32:
                    i.preventDefault();
                    i.stopPropagation();
                    g.fm.quickLook.toggle();
                    break;
                case 27:
                    g.fm.quickLook.hide();
                    break
                }
            });
            if (!this.fm.options.disableShortcuts) {
                a(document).bind("keydown", function (j) {
                    var i = j.ctrlKey || j.metaKey;
                    if (g.lock) {
                        return
                    }
                    switch (j.keyCode) {
                    case 8:
                        if (i && g.ui.isCmdAllowed("rm")) {
                            j.preventDefault();
                            g.ui.exec("rm")
                        }
                        break;
                    case 13:
                        if (g.ui.isCmdAllowed("select")) {
                            return g.ui.exec("select")
                        }
                        g.ui.execIfAllowed("open");
                        break;
                    case 46:
                        g.ui.execIfAllowed("rm");
                        break;
                    case 65:
                        if (i) {
                            j.preventDefault();
                            g.fm.selectAll()
                        }
                        break;
                    case 67:
                        i && g.ui.execIfAllowed("copy");
                        break;
                    case 73:
                        if (i) {
                            j.preventDefault();
                            g.ui.exec("info")
                        }
                        break;
                    case 78:
                        if (i) {
                            j.preventDefault();
                            g.ui.execIfAllowed("mkdir")
                        }
                        break;
                    case 85:
                        if (i) {
                            j.preventDefault();
                            g.ui.execIfAllowed("upload")
                        }
                        break;
                    case 86:
                        i && g.ui.execIfAllowed("paste");
                        break;
                    case 88:
                        i && g.ui.execIfAllowed("cut");
                        break;
                    case 113:
                        g.ui.execIfAllowed("rename");
                        break
                    }
                })
            }
        };
        this.updateNav = function () {
            a("a", this.tree).click(function (h) {
                h.preventDefault();
                var g = a(this),
                    i;
                if (h.target.nodeName == "DIV" && a(h.target).hasClass("collapsed")) {
                    a(h.target).toggleClass("expanded").parent().next("ul").toggle(300)
                } else {
                    if (g.attr("key") != b.fm.cwd.hash) {
                        if (g.hasClass("noaccess") || g.hasClass("dropbox")) {
                            b.fm.view.error("Access denied")
                        } else {
                            b.ui.exec("open", g.trigger("select")[0])
                        }
                    } else {
                        i = g.children(".collapsed");
                        if (i.length) {
                            i.toggleClass("expanded");
                            g.next("ul").toggle(300)
                        }
                    }
                }
            });
            a("a:not(.noaccess,.readonly)", this.tree).droppable({
                tolerance: "pointer",
                accept: "div[key],tr[key]",
                over: function () {
                    a(this).addClass("el-finder-droppable")
                },
                out: function () {
                    a(this).removeClass("el-finder-droppable")
                },
                drop: function (h, g) {
                    a(this).removeClass("el-finder-droppable");
                    b.fm.drop(h, g, a(this).attr("key"))
                }
            });
            this.fm.options.places && this.updatePlaces()
        };
        this.updatePlaces = function () {
            this.fm.view.plc.children("li").find("li").draggable({
                scroll: false,
                stop: function () {
                    if (b.fm.removePlace(a(this).children("a").attr("key"))) {
                        a(this).remove();
                        if (!a("li", b.fm.view.plc.children("li")).length) {
                            b.fm.view.plc.children("li").find("div").removeClass("collapsed expanded").end().children("ul").hide()
                        }
                    }
                }
            })
        };
        this.updateCwd = function () {
            a("[key]", this.cwd).bind("dblclick", function (g) {
                b.fm.select(a(this), true);
                b.ui.exec(b.ui.isCmdAllowed("select") ? "select" : "open")
            }).draggable({
                delay: 3,
                addClasses: false,
                appendTo: ".el-finder-cwd",
                revert: true,
                drag: function (h, g) {
                    g.helper.toggleClass("el-finder-drag-copy", h.shiftKey || h.ctrlKey)
                },
                helper: function () {
                    var g = a(this),
                        i = a('<div class="el-finder-drag-helper"/>'),
                        j = 0;
                    !g.hasClass("ui-selected") && b.fm.select(g, true);
                    b.cwd.find(".ui-selected").each(function (h) {
                        var k = b.fm.options.view == "icons" ? a(this).clone().removeClass("ui-selected") : a(b.fm.view.renderIcon(b.fm.cdc[a(this).attr("key")]));
                        if (j++ == 0 || j % 12 == 0) {
                            k.css("margin-left", 0)
                        }
                        i.append(k)
                    });
                    return i.css("width", (j <= 12 ? 85 + (j - 1) * 29 : 387) + "px")
                }
            }).filter(".directory").droppable({
                tolerance: "pointer",
                accept: "div[key],tr[key]",
                over: function () {
                    a(this).addClass("el-finder-droppable")
                },
                out: function () {
                    a(this).removeClass("el-finder-droppable")
                },
                drop: function (h, g) {
                    a(this).removeClass("el-finder-droppable");
                    b.fm.drop(h, g, a(this).attr("key"))
                }
            });
            if (a.browser.msie) {
                a("*", this.cwd).attr("unselectable", "on").filter("[key]").bind("dragstart", function () {
                    b.cwd.selectable("disable").removeClass("ui-state-disabled ui-selectable-disabled")
                }).bind("dragstop", function () {
                    b.cwd.selectable("enable")
                })
            }
        };

        function e(h, i) {
            var j, g, k;
            if (!a("[key]", b.cwd).length) {
                return
            }
            if (b.fm.selected.length == 0) {
                j = a("[key]:" + (h ? "first" : "last"), b.cwd);
                b.fm.select(j)
            } else {
                if (i) {
                    j = a(".ui-selected:" + (h ? "last" : "first"), b.cwd);
                    g = j[h ? "next" : "prev"]("[key]");
                    if (g.length) {
                        j = g
                    }
                    b.fm.select(j, true)
                } else {
                    if (b.pointer) {
                        k = a('[key="' + b.pointer + '"].ui-selected', b.cwd)
                    }
                    if (!k || !k.length) {
                        k = a(".ui-selected:" + (h ? "last" : "first"), b.cwd)
                    }
                    j = k[h ? "next" : "prev"]("[key]");
                    if (!j.length) {
                        j = k
                    } else {
                        if (!j.hasClass("ui-selected")) {
                            b.fm.select(j)
                        } else {
                            if (!k.hasClass("ui-selected")) {
                                b.fm.unselect(j)
                            } else {
                                g = k[h ? "prev" : "next"]("[key]");
                                if (!g.length || !g.hasClass("ui-selected")) {
                                    b.fm.unselect(k)
                                } else {
                                    while ((g = h ? j.next("[key]") : j.prev("[key]")) && j.hasClass("ui-selected")) {
                                        j = g
                                    }
                                    b.fm.select(j)
                                }
                            }
                        }
                    }
                }
            }
            b.pointer = j.attr("key");
            b.fm.checkSelectedPos(h)
        }
    }
})(jQuery);