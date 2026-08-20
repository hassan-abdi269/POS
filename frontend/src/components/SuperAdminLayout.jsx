// src/components/SuperAdminLayout.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Outlet,
  NavLink,
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  LayoutDashboard,
  Store,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Search,
  ShieldCheck
} from 'lucide-react';

import { authService } from '../service/api';


// ============================================================
// SUPER ADMIN LAYOUT
// ============================================================

const SuperAdminLayout = () => {

  // ==========================================================
  // ROUTER
  // ==========================================================

  const navigate = useNavigate();
  const location = useLocation();


  // ==========================================================
  // STATE
  // ==========================================================

  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  );

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 768
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);


  // ==========================================================
  // NAVIGATION ITEMS
  // ==========================================================

  const navItems = useMemo(
    () => [
      {
        path: '/superadmin/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        description: 'Overview'
      },
      {
        path: '/superadmin/shops',
        icon: Store,
        label: 'All Shops',
        description: 'Manage shops'
      },
      {
        path: '/superadmin/payments',
        icon: CreditCard,
        label: 'Payments',
        description: 'Payment records'
      },
      {
        path: '/superadmin/analytics',
        icon: BarChart3,
        label: 'Analytics',
        description: 'Business insights'
      },
      {
        path: '/superadmin/settings',
        icon: Settings,
        label: 'Settings',
        description: 'System settings'
      }
    ],
    []
  );


  // ==========================================================
  // LOAD CURRENT USER
  // ==========================================================

  const user = useMemo(() => {

    try {

      const currentUser =
        authService.getCurrentUser();

      console.log(
        '👤 SuperAdminLayout user:',
        currentUser
      );

      return currentUser || null;

    } catch (error) {

      console.error(
        '❌ Failed to load current user:',
        error
      );

      return null;
    }

  }, []);


  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userEmail =
    user?.email ||
    'superadmin@system.com';

  const userName =
    user?.username ||
    user?.name ||
    userEmail.split('@')[0] ||
    'Admin';

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();


  // ==========================================================
  // HANDLE WINDOW RESIZE
  // ==========================================================

  useEffect(() => {

    const handleResize = () => {

      const mobile =
        window.innerWidth < 768;

      setIsMobile(mobile);

      if (mobile) {

        setSidebarOpen(false);

      } else {

        setSidebarOpen(true);

      }

    };


    window.addEventListener(
      'resize',
      handleResize
    );


    return () => {

      window.removeEventListener(
        'resize',
        handleResize
      );

    };

  }, []);


  // ==========================================================
  // CLOSE MOBILE SIDEBAR WHEN ROUTE CHANGES
  // ==========================================================

  useEffect(() => {

    if (isMobile) {

      setSidebarOpen(false);

    }

    setIsProfileOpen(false);

    setIsSearchOpen(false);

  }, [
    location.pathname,
    isMobile
  ]);


  // ==========================================================
  // TOGGLE SIDEBAR
  // ==========================================================

  const toggleSidebar = useCallback(() => {

    setSidebarOpen(
      previous => !previous
    );

  }, []);


  // ==========================================================
  // CLOSE SIDEBAR
  // ==========================================================

  const closeSidebar = useCallback(() => {

    if (isMobile) {

      setSidebarOpen(false);

    }

  }, [isMobile]);


  // ==========================================================
  // HANDLE LOGOUT
  // ==========================================================

  const handleLogout = useCallback(
    async () => {

      if (isLoggingOut) {
        return;
      }

      setIsLoggingOut(true);

      try {

        console.log(
          '🔓 Super admin logout requested'
        );

        await authService.logout();

        console.log(
          '✅ Super admin logout successful'
        );

      } catch (error) {

        console.error(
          '❌ Logout error:',
          error
        );

      } finally {

        // ----------------------------------------------------
        // Always clear local authentication data.
        // Backend logout may succeed or fail.
        // ----------------------------------------------------

        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        localStorage.removeItem('authUser');

        // ----------------------------------------------------
        // Clear session-related values if your frontend
        // stores any of them.
        // ----------------------------------------------------

        sessionStorage.removeItem('user');
        sessionStorage.removeItem('admin');
        sessionStorage.removeItem('authUser');

        setIsLoggingOut(false);

        navigate(
          '/superadmin/login',
          {
            replace: true
          }
        );

      }

    },
    [
      isLoggingOut,
      navigate
    ]
  );


  // ==========================================================
  // PAGE TITLE
  // ==========================================================

  const currentPage = useMemo(() => {

    const exactMatch =
      navItems.find(
        item => location.pathname === item.path
      );

    if (exactMatch) {
      return exactMatch.label;
    }


    const prefixMatch =
      navItems.find(
        item =>
          location.pathname.startsWith(
            item.path
          )
      );

    return prefixMatch?.label ||
      'Super Admin';

  }, [
    location.pathname,
    navItems
  ]);


  // ==========================================================
  // NAVIGATION LINK
  // ==========================================================

  const renderNavItem = (
    item
  ) => {

    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeSidebar}
        title={
          !sidebarOpen && !isMobile
            ? item.label
            : undefined
        }
        className={({ isActive }) => {

          return `
            group
            flex
            items-center
            gap-2
            sm:gap-3
            px-3
            py-2.5
            sm:py-3
            rounded-xl
            transition-all
            duration-200
            relative
            ${
              isActive
                ? `
                  bg-blue-600
                  text-white
                  shadow-lg
                  shadow-blue-900/20
                `
                : `
                  text-gray-300
                  hover:bg-gray-800
                  hover:text-white
                `
            }
            ${
              !sidebarOpen && !isMobile
                ? 'justify-center px-2'
                : ''
            }
          `;

        }}
      >

        {({ isActive }) => (

          <>
            {/* Active Indicator */}

            {isActive && (
              <span
                className="
                  absolute
                  left-0
                  top-1/2
                  -translate-y-1/2
                  w-1
                  h-7
                  bg-white
                  rounded-r-full
                "
              />
            )}


            {/* Icon */}

            <Icon
              className={`
                h-5
                w-5
                flex-shrink-0
                transition-transform
                duration-200
                ${
                  isActive
                    ? 'scale-105'
                    : 'group-hover:scale-105'
                }
              `}
            />


            {/* Text */}

            {sidebarOpen && (
              <div
                className="
                  flex
                  flex-col
                  min-w-0
                  flex-1
                "
              >

                <span
                  className="
                    text-sm
                    sm:text-base
                    font-medium
                    truncate
                  "
                >
                  {item.label}
                </span>

                <span
                  className={`
                    hidden
                    lg:block
                    text-[10px]
                    truncate
                    ${
                      isActive
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {item.description}
                </span>

              </div>
            )}


            {/* Active Arrow */}

            {isActive &&
              sidebarOpen && (
                <span
                  className="
                    ml-auto
                    w-1.5
                    h-1.5
                    bg-white
                    rounded-full
                  "
                />
              )}

          </>

        )}

      </NavLink>
    );
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        flex
        h-screen
        w-full
        bg-gray-50
        overflow-hidden
      "
    >

      {/* ======================================================
          MOBILE OVERLAY
      ====================================================== */}

      {isMobile &&
        sidebarOpen && (

          <div
            className="
              fixed
              inset-0
              bg-black/50
              backdrop-blur-[1px]
              z-40
              transition-opacity
              duration-300
            "
            onClick={closeSidebar}
            aria-hidden="true"
          />

        )}


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed
          md:relative
          z-50
          h-full
          flex
          flex-col
          bg-gray-900
          text-white
          shadow-2xl
          transition-all
          duration-300
          ease-in-out

          ${
            isMobile
              ? sidebarOpen
                ? 'translate-x-0 w-72'
                : '-translate-x-full w-72'
              : sidebarOpen
                ? 'translate-x-0 w-64'
                : 'translate-x-0 w-20'
          }
        `}
      >

        {/* ====================================================
            SIDEBAR HEADER
        ==================================================== */}

        <div
          className={`
            h-16
            sm:h-[68px]
            px-3
            sm:px-4
            border-b
            border-gray-800
            flex
            items-center
            ${
              sidebarOpen
                ? 'justify-between'
                : 'justify-center'
            }
          `}
        >

          {/* Logo */}

          <div
            className={`
              flex
              items-center
              gap-2.5
              ${
                !sidebarOpen && !isMobile
                  ? 'justify-center'
                  : ''
              }
            `}
          >

            <div
              className="
                bg-blue-600
                p-2
                rounded-xl
                shadow-lg
                shadow-blue-900/30
                flex-shrink-0
              "
            >

              <Store
                className="
                  h-5
                  w-5
                  sm:h-6
                  sm:w-6
                  text-white
                "
              />

            </div>


            {sidebarOpen && (

              <div
                className="
                  flex
                  flex-col
                  leading-tight
                "
              >

                <span
                  className="
                    font-bold
                    text-base
                    sm:text-lg
                  "
                >
                  Tirsi POS
                </span>

                <span
                  className="
                    text-[10px]
                    text-gray-400
                    uppercase
                    tracking-wider
                  "
                >
                  Super Admin
                </span>

              </div>

            )}

          </div>


          {/* Desktop Collapse / Mobile Close */}

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={
              sidebarOpen
                ? 'Close sidebar'
                : 'Open sidebar'
            }
            className={`
              p-1.5
              rounded-lg
              text-gray-400
              hover:text-white
              hover:bg-gray-800
              transition-colors
              ${
                !sidebarOpen && !isMobile
                  ? 'hidden'
                  : ''
              }
            `}
          >

            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}

          </button>


          {/* Collapsed Desktop Menu */}

          {!sidebarOpen &&
            !isMobile && (

              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Open sidebar"
                className="
                  absolute
                  right-[-14px]
                  top-5
                  w-7
                  h-7
                  rounded-full
                  bg-gray-800
                  border
                  border-gray-700
                  text-gray-300
                  hover:text-white
                  hover:bg-blue-600
                  flex
                  items-center
                  justify-center
                  shadow-lg
                  transition-colors
                "
              >

                <Menu
                  className="
                    h-4
                    w-4
                  "
                />

              </button>

            )}

        </div>


        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <nav
          className="
            flex-1
            p-3
            sm:p-4
            space-y-1.5
            overflow-y-auto
            scrollbar-thin
            scrollbar-thumb-gray-700
          "
        >

          {sidebarOpen && (

            <div
              className="
                mb-3
                px-3
                text-[10px]
                sm:text-xs
                font-semibold
                text-gray-500
                uppercase
                tracking-widest
              "
            >
              Main Menu
            </div>

          )}


          {navItems.map(
            renderNavItem
          )}

        </nav>


        {/* ====================================================
            SIDEBAR BOTTOM
        ==================================================== */}

        <div
          className={`
            p-3
            sm:p-4
            border-t
            border-gray-800
            ${
              !sidebarOpen && !isMobile
                ? 'flex flex-col items-center'
                : ''
            }
          `}
        >

          {/* User Profile */}

          {sidebarOpen ? (

            <div
              className="
                mb-3
                p-2.5
                bg-gray-800
                rounded-xl
                border
                border-gray-700
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2.5
                "
              >

                {/* Avatar */}

                <div
                  className="
                    w-9
                    h-9
                    rounded-full
                    bg-blue-600
                    flex
                    items-center
                    justify-center
                    text-white
                    font-bold
                    text-sm
                    flex-shrink-0
                  "
                >
                  {userInitial}
                </div>


                {/* User Details */}

                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-white
                      truncate
                    "
                  >
                    {userName}
                  </p>

                  <p
                    className="
                      text-[10px]
                      text-gray-400
                      truncate
                    "
                  >
                    {userEmail}
                  </p>

                </div>


                {/* Profile Toggle */}

                <button
                  type="button"
                  onClick={() =>
                    setIsProfileOpen(
                      previous => !previous
                    )
                  }
                  aria-label="Toggle profile menu"
                  className="
                    p-1
                    rounded
                    text-gray-400
                    hover:text-white
                    hover:bg-gray-700
                  "
                >

                  <ChevronDown
                    className={`
                      h-4
                      w-4
                      transition-transform
                      duration-200
                      ${
                        isProfileOpen
                          ? 'rotate-180'
                          : ''
                      }
                    `}
                  />

                </button>

              </div>


              {/* Profile Dropdown */}

              {isProfileOpen && (

                <div
                  className="
                    mt-2
                    pt-2
                    border-t
                    border-gray-700
                    space-y-1
                  "
                >

                  <button
                    type="button"
                    onClick={() => {

                      setIsProfileOpen(false);

                      navigate(
                        '/superadmin/settings'
                      );

                    }}
                    className="
                      w-full
                      flex
                      items-center
                      gap-2
                      px-2.5
                      py-2
                      text-xs
                      text-gray-300
                      hover:text-white
                      hover:bg-gray-700
                      rounded-lg
                      transition-colors
                    "
                  >

                    <Settings
                      className="
                        h-4
                        w-4
                      "
                    />

                    <span>
                      Settings
                    </span>

                  </button>


                  <button
                    type="button"
                    onClick={() => {

                      setIsProfileOpen(false);

                      handleLogout();

                    }}
                    disabled={isLoggingOut}
                    className="
                      w-full
                      flex
                      items-center
                      gap-2
                      px-2.5
                      py-2
                      text-xs
                      text-red-400
                      hover:text-red-300
                      hover:bg-red-900/20
                      rounded-lg
                      transition-colors
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  >

                    <LogOut
                      className="
                        h-4
                        w-4
                      "
                    />

                    <span>
                      {isLoggingOut
                        ? 'Logging out...'
                        : 'Logout'}
                    </span>

                  </button>

                </div>

              )}

            </div>

          ) : (

            /* Collapsed Avatar */

            !isMobile && (

              <button
                type="button"
                onClick={() =>
                  setIsProfileOpen(
                    previous => !previous
                  )
                }
                title={userEmail}
                className="
                  mb-3
                  w-9
                  h-9
                  bg-blue-600
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  font-bold
                  text-sm
                  hover:ring-2
                  hover:ring-blue-400
                  transition-all
                "
              >
                {userInitial}
              </button>

            )

          )}


          {/* Logout Button */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              flex
              items-center
              gap-2.5
              px-3
              py-2.5
              rounded-xl
              text-gray-300
              hover:bg-red-600
              hover:text-white
              transition-colors
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${
                !sidebarOpen && !isMobile
                  ? 'justify-center w-10 px-0'
                  : 'w-full'
              }
            `}
            title={
              !sidebarOpen && !isMobile
                ? 'Logout'
                : undefined
            }
          >

            <LogOut
              className="
                h-5
                w-5
                flex-shrink-0
              "
            />

            {sidebarOpen && (

              <span
                className="
                  text-sm
                  font-medium
                "
              >
                {isLoggingOut
                  ? 'Logging out...'
                  : 'Logout'}
              </span>

            )}

          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <div
        className="
          flex-1
          min-w-0
          flex
          flex-col
          overflow-hidden
        "
      >

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <header
          className="
            bg-white
            border-b
            border-gray-200
            shadow-sm
            px-3
            sm:px-5
            lg:px-6
            py-3
            flex
            items-center
            justify-between
            gap-3
            flex-shrink-0
            z-30
          "
        >

          {/* Left Side */}

          <div
            className="
              flex
              items-center
              gap-2
              sm:gap-3
              min-w-0
            "
          >

            {/* Mobile Menu */}

            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Open navigation menu"
              className="
                md:hidden
                p-2
                rounded-lg
                text-gray-600
                hover:bg-gray-100
                transition-colors
                flex-shrink-0
              "
            >

              <Menu
                className="
                  h-5
                  w-5
                "
              />

            </button>


            {/* Page Icon */}

            <div
              className="
                hidden
                sm:flex
                w-9
                h-9
                bg-blue-50
                rounded-lg
                items-center
                justify-center
                flex-shrink-0
              "
            >

              <ShieldCheck
                className="
                  h-5
                  w-5
                  text-blue-600
                "
              />

            </div>


            {/* Page Title */}

            <div
              className="
                min-w-0
              "
            >

              <h1
                className="
                  text-base
                  sm:text-lg
                  lg:text-xl
                  font-semibold
                  text-gray-800
                  truncate
                "
              >
                {currentPage}
              </h1>

              <p
                className="
                  hidden
                  sm:block
                  text-[10px]
                  lg:text-xs
                  text-gray-500
                  truncate
                "
              >
                Tirsi POS Management System
              </p>

            </div>

          </div>


          {/* Right Side */}

          <div
            className="
              flex
              items-center
              gap-1.5
              sm:gap-3
              flex-shrink-0
            "
          >

            {/* Desktop Search */}

            <div
              className="
                hidden
                sm:block
                relative
              "
            >

              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
                className="
                  w-32
                  md:w-48
                  lg:w-56
                  pl-9
                  pr-3
                  py-2
                  text-sm
                  border
                  border-gray-200
                  rounded-lg
                  bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-400
                  focus:border-transparent
                  hover:bg-white
                  transition-colors
                "
              />

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-gray-400
                "
              />

            </div>


            {/* Mobile Search Button */}

            <button
              type="button"
              onClick={() =>
                setIsSearchOpen(
                  previous => !previous
                )
              }
              aria-label="Toggle search"
              className="
                sm:hidden
                p-2
                rounded-lg
                text-gray-500
                hover:bg-gray-100
                transition-colors
              "
            >

              <Search
                className="
                  h-5
                  w-5
                "
              />

            </button>


            {/* Notifications */}

            <button
              type="button"
              aria-label="Notifications"
              className="
                p-2
                rounded-lg
                text-gray-500
                hover:bg-gray-100
                transition-colors
                relative
              "
            >

              <Bell
                className="
                  h-5
                  w-5
                "
              />

              <span
                className="
                  absolute
                  -top-0.5
                  -right-0.5
                  min-w-[16px]
                  h-4
                  px-1
                  bg-red-500
                  text-white
                  text-[9px]
                  font-bold
                  rounded-full
                  flex
                  items-center
                  justify-center
                  border-2
                  border-white
                "
              >
                3
              </span>

            </button>


            {/* Desktop User */}

            <div
              className="
                hidden
                md:flex
                items-center
                gap-2
                pl-2
                border-l
                border-gray-200
              "
            >

              <div
                className="
                  w-9
                  h-9
                  bg-blue-600
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  font-bold
                  text-sm
                "
              >
                {userInitial}
              </div>

              <div
                className="
                  hidden
                  lg:block
                  max-w-[150px]
                "
              >

                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-700
                    truncate
                  "
                >
                  {userName}
                </p>

                <p
                  className="
                    text-[10px]
                    text-gray-400
                    truncate
                  "
                >
                  Super Administrator
                </p>

              </div>

            </div>


            {/* Mobile User */}

            <div
              className="
                flex
                md:hidden
                items-center
                gap-1.5
              "
            >

              <div
                className="
                  w-8
                  h-8
                  bg-blue-600
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  font-bold
                  text-xs
                "
              >
                {userInitial}
              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            MOBILE SEARCH
        ==================================================== */}

        {isSearchOpen && (

          <div
            className="
              sm:hidden
              px-3
              py-2.5
              bg-white
              border-b
              border-gray-200
              flex-shrink-0
            "
          >

            <div
              className="
                relative
              "
            >

              <input
                type="text"
                placeholder="Search..."
                aria-label="Search"
                autoFocus
                className="
                  w-full
                  pl-9
                  pr-3
                  py-2.5
                  text-sm
                  border
                  border-gray-200
                  rounded-lg
                  bg-gray-50
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-400
                  focus:border-transparent
                "
              />

              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  h-4
                  w-4
                  text-gray-400
                "
              />

            </div>

          </div>

        )}


        {/* ====================================================
            PAGE CONTENT
        ==================================================== */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-gray-50
            p-3
            sm:p-5
            lg:p-6
          "
        >

          <div
            className="
              max-w-7xl
              mx-auto
              w-full
            "
          >

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
};


export default SuperAdminLayout;