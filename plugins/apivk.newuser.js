(function(){
	var msg_install = 'Для работы приложения его необходимо <a href="#" id="APIVK_msga">установить</a>';
	var msg_settings = 'Для работы приложения необходимо установить требуемые <a href="#" id="APIVK_msga">настройки</a>';

	/**
	 * Show message which don't allow user to use application. Used if user
	 * hasn't installed application or set wrong settins.
	 *
	 * @param {String} msg Message text to show.
	 * @param {Number} settings Settings value application need user to set.
	 */
	function showMessage(msg /* , settings */) {

		//define settings if this is 'wrong settings' message
		var settings = -1;
		if (arguments.length > 1) {
			settings = arguments[1];
		}

		//show message
		if (document.getElementById('APIVK_msgbox') == null) {

			//create new message box
			document.getElementsByTagName('body')[0].innerHTML +=
				'<div id="APIVK_msgbox" style="' +
				'position: absolute;' +
				'width: 100%; height: 100%;' +
				'margin: 0; padding: 50px 0 0 0;' +
				'border-top: #dbe2e8 1px solid;' +
				'top: 0; left: 0;' +
				'z-index: 100;' +
				'background: white; color: gray;' +
				'font-size:12px;' +
				'text-align:center;' +
				'">' +
				msg +
				'</div>';
		} else {

			//just change text in existing message box
			document.getElementById('APIVK_msgbox').innerHTML = msg;
			document.getElementById('APIVK_msgbox').style.display = 'block';
		}

		//create onclick handler
		document.getElementById('APIVK_msga').addEventListener('click', function() {

				//this is 'wrong settings' message
				if (settings >= 0) {
					this_proxy.external.showSettingsBox(settings);

					//this is 'not installed' message
				} else {
					this_proxy.external.showInstallBox();
				}
			},
			true
			);
	}

	/**
	 * Hide message previously shown with showMessage().
	 */
	function hideMessage() {
		if (document.getElementById('APIVK_msgbox') != null) {
			document.getElementById('APIVK_msgbox').style.display = 'none';
		}
	}


	/**** Public: ****/
	/**
	 * Ask user to install application (add to their page) in indefinite
	 * loop until user finally installs application.
	 * Warning!  Application will ask user to install application until he
	 * did it, so if user don't want to add application to his page, he
	 * can't run application.
	 *
	 * @param {Function} ifInstalled Callback function which executed if and
	 *                             only if application is installed. First
	 *                             time function executes if user installs
	 *                             application after makeInstall() called.
	 *                             But unlike
	 *                             addCallback('onApplicationAdded', ...),
	 *                             this function executes even if
	 *                             application already added before
	 *                             makeInstall() called. This means that if
	 *                             you use makeInstall(fucnName) then
	 *                             funcName() will be executed every time
	 *                             user runs application, even if he
	 *                             installed application only once long time
	 *                             ago.
	 */
	APIVK.prototype.makeInstall = function(/* ifInstalled */) {

		//define if there is ifInstalled callback
		var appInstalled = null;
		if (arguments.length > 0) {
			appInstalled = arguments[0];
		}

		//current application settings and settings we need are different so
		//show installation window
		if (this_proxy.params.is_app_user != 1) {

			//hide entire application with special message
			showMessage(msg_install);

			this_proxy.external.showInstallBox();

			//when user adds application
			this.addCallback(
			                 'onApplicationAdded',
			                 function() {

				                 //set new settings as current and verify if settings are
				                 //correct again
				                 this_proxy.params.is_app_user = 1;
				                 hideMessage();

				                 //application added so run appInstalled
				                 if (appInstalled != null) appInstalled();
			                 }
			                 );

			//application is already installed, so just run callback
		} else {
			if (appInstalled != null) appInstalled();
		}

	}

	/**
	 * Ask user to set appropriate settings and wait for user to do it.
	 * Warning! Application will ask user to specify settings until he did
	 * it, so if user don't want to set your settings, he can't run
	 * application.
	 *
	 * @param {Number} settings Settings you want user to set to application.
	 *                        You can use either integer value according to
	 *                        official Vkontakte documentation on
	 *                        http://vkontakte.ru/page7002134 or combination
	 *                        of .SETT_* constants.
	 */
	APIVK.prototype.makeSettings = function(settings) {

		//current application settings and settings we need are different so
		//show settings-change window
		if ((this_proxy.params.api_settings & settings) != settings) {

			//hide entire application with special message
			showMessage(msg_settings, settings);

			this_proxy.external.showSettingsBox(settings);
		}

		//when settings changed
		this.addCallback('onSettingsChanged', function(new_settings) {

				//set new settings as current and verify if settings are
				//correct again
				this_proxy.params.api_settings = new_settings;

				//current application settings and settings we need are the
				//same so hide message window
				if ((this_proxy.params.api_settings & settings) == settings) {
					hideMessage();
				}
			}
			);
	}
})()