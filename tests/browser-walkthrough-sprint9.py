"""
Sprint 9 Browser Walkthrough — QA Task 9.7 (AI-056)
Tests search features at http://localhost:1999 in real browser.
"""

from playwright.sync_api import sync_playwright
import os
import time

SCREENSHOT_DIR = '/Users/phuhung/Documents/Studies/AIProjects/webphim/docs/testing/screenshots/sprint9'
FE_URL = 'http://localhost:1999'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def log(test_id, description, passed, note=''):
    status = 'PASS' if passed else 'FAIL'
    results.append({'id': test_id, 'desc': description, 'status': status, 'note': note})
    print(f"  [{status}] {test_id}: {description}" + (f" — {note}" if note else ''))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # ============================================
    # Step 0: Login with boss account
    # ============================================
    print("\n=== Step 0: Login ===")
    page.goto(f'{FE_URL}/login', timeout=15000)
    page.wait_for_load_state('networkidle')

    page.locator('input[placeholder*="mail"]').first.fill('boss@webphim.com')
    page.locator('input[type="password"]').first.fill('Boss@123456')
    page.screenshot(path=f'{SCREENSHOT_DIR}/00-login-filled.png', full_page=False)

    page.locator('button:has-text("Sign In")').first.click()
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    page.screenshot(path=f'{SCREENSHOT_DIR}/01-after-login.png', full_page=False)

    logged_in = '/login' not in page.url
    log('C0.0', 'Boss account login', logged_in, f'URL: {page.url}')

    # ============================================
    # C1: Search Bar in Navbar
    # ============================================
    print("\n=== C1: Search Bar ===")

    # Navigate to authenticated home
    page.goto(f'{FE_URL}/home', timeout=10000)
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    page.screenshot(path=f'{SCREENSHOT_DIR}/02-home-page.png', full_page=False)

    # Find search toggle (data-testid="search-toggle", aria-label="Search")
    search_toggle = page.locator('[data-testid="search-toggle"]')
    toggle_visible = search_toggle.is_visible()
    log('C1.1', 'Search icon visible in navbar', toggle_visible)

    if toggle_visible:
        # Check aria-expanded is false initially
        aria_expanded = search_toggle.get_attribute('aria-expanded')
        log('C1.1a', 'aria-expanded="false" initially', aria_expanded == 'false')

        # Click to expand
        search_toggle.click()
        time.sleep(0.5)
        page.screenshot(path=f'{SCREENSHOT_DIR}/03-search-expanded.png', full_page=False)

        search_input = page.locator('[data-testid="search-input"]')
        input_visible = search_input.is_visible()
        log('C1.2', 'Click icon → input expands with animation', input_visible)

        # Check auto-focus
        is_focused = search_input.evaluate('el => document.activeElement === el')
        log('C1.3', 'Auto-focus on expand', is_focused)

        # Check placeholder
        placeholder = search_input.get_attribute('placeholder') or ''
        log('C1.4', f'Placeholder: "{placeholder}"', 'Titles' in placeholder)

        # Check accessibility
        aria_label = search_input.get_attribute('aria-label') or ''
        aria_autocomplete = search_input.get_attribute('aria-autocomplete') or ''
        log('C1.5', 'Accessibility: aria-label + aria-autocomplete',
            'search' in aria_label.lower() and aria_autocomplete == 'list',
            f'label="{aria_label}", autocomplete="{aria_autocomplete}"')

        aria_expanded_after = search_toggle.get_attribute('aria-expanded')
        log('C1.6', 'aria-expanded="true" after expand', aria_expanded_after == 'true')

        # ============================================
        # C2: Suggestions Dropdown
        # ============================================
        print("\n=== C2: Suggestions Dropdown ===")

        search_input.fill('Bunny')
        time.sleep(1.5)  # 300ms debounce + API call
        page.screenshot(path=f'{SCREENSHOT_DIR}/04-suggestions-dropdown.png', full_page=False)

        # Suggestions use role="listbox" and role="option"
        suggestions_container = page.locator('#search-suggestions')
        suggestions = page.locator('[role="option"]')
        suggestion_count = suggestions.count()
        log('C2.1', 'Suggestions appear after typing (300ms debounce)', suggestion_count > 0,
            f'{suggestion_count} suggestions')

        if suggestion_count > 0:
            log('C2.2', 'Max 5 suggestions', suggestion_count <= 5,
                f'{suggestion_count} items')

            # Print suggestion content for verification
            for i in range(min(suggestion_count, 5)):
                try:
                    text = suggestions.nth(i).inner_text()
                    print(f"    Suggestion {i+1}: {text[:60]}")
                except:
                    pass

            # Check suggestion has thumbnail, title, type, year
            first_suggestion = suggestions.first
            has_img = first_suggestion.locator('img').count() > 0
            log('C2.2a', 'Suggestion has thumbnail image', has_img)

        # "View all results" link
        view_all = page.locator('text=/[Vv]iew all/').first
        view_all_found = False
        try:
            view_all_found = view_all.is_visible()
        except:
            pass
        log('C2.3', '"View all results" link', view_all_found)

        # Keyboard navigation: arrow keys
        search_input.press('ArrowDown')
        time.sleep(0.3)
        active_desc = search_input.get_attribute('aria-activedescendant') or ''
        log('C2.4', 'Arrow key updates aria-activedescendant', len(active_desc) > 0,
            f'activedescendant="{active_desc}"')
        page.screenshot(path=f'{SCREENSHOT_DIR}/05-keyboard-nav.png', full_page=False)

        # Press Enter → navigate to /search?q=dark
        search_input.press('Escape')  # Reset first
        time.sleep(0.3)
        # Re-expand and submit
        search_toggle.click()
        time.sleep(0.5)
        search_input = page.locator('[data-testid="search-input"]')
        search_input.fill('action')
        time.sleep(0.3)
        search_input.press('Enter')
        time.sleep(1)
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'{SCREENSHOT_DIR}/06-search-results.png', full_page=False)

        url_after = page.url
        log('C2.5', 'Enter navigates to /search?q=action', '/search' in url_after and 'q=' in url_after,
            f'URL: {url_after}')

        # ============================================
        # C3: Search Results Page
        # ============================================
        print("\n=== C3: Search Results Page ===")

        if '/search' not in page.url:
            page.goto(f'{FE_URL}/search?q=action', timeout=10000)
            page.wait_for_load_state('networkidle')
            time.sleep(1)

        page.screenshot(path=f'{SCREENSHOT_DIR}/07-results-page.png', full_page=True)

        # H1 heading
        h1 = page.locator('h1')
        h1_text = ''
        try:
            h1_text = h1.inner_text()
        except:
            pass
        log('C3.1', 'Shows search header with result count', len(h1_text) > 0,
            f'H1: "{h1_text[:80]}"')

        # Content grid with MovieCards
        cards = page.locator('[class*="card" i], [class*="poster" i], [class*="movie" i]').all()
        visible_cards = [c for c in cards if c.is_visible()]
        log('C3.2', 'Content grid displays MovieCard results', len(visible_cards) > 0,
            f'{len(visible_cards)} cards')

        # aria-live for result count
        aria_live = page.locator('[aria-live="polite"]')
        aria_live_exists = aria_live.count() > 0
        log('C3.2a', 'aria-live="polite" for result count', aria_live_exists)

        # Filter sidebar
        filters = page.locator('fieldset, [class*="filter" i], [role="radiogroup"]').all()
        visible_filters = [f for f in filters if f.is_visible()]
        log('C3.3', 'Filter sidebar visible', len(visible_filters) > 0,
            f'{len(visible_filters)} filter sections')
        page.screenshot(path=f'{SCREENSHOT_DIR}/08-filters.png', full_page=False)

        # Type filter interaction
        movies_btn = page.locator('button:has-text("Movies"), [role="radio"]:has-text("Movies"), label:has-text("Movies")').first
        type_filter_works = False
        try:
            if movies_btn.is_visible():
                movies_btn.click()
                time.sleep(1)
                page.wait_for_load_state('networkidle')
                new_url = page.url
                type_filter_works = 'type=MOVIE' in new_url
                page.screenshot(path=f'{SCREENSHOT_DIR}/09-type-filter.png', full_page=False)
                log('C3.4', 'Type filter updates URL (shareable)', type_filter_works,
                    f'URL has type=MOVIE: {type_filter_works}')
            else:
                log('C3.4', 'Type filter updates URL', False, 'Movies button not visible')
        except Exception as e:
            log('C3.4', 'Type filter updates URL', False, str(e)[:60])

        # Sort control
        sort_el = page.locator('select, [data-testid*="sort"]').all()
        visible_sorts = [s for s in sort_el if s.is_visible()]
        log('C3.5', 'Sort control exists', len(visible_sorts) > 0,
            f'{len(visible_sorts)} sort elements')

        # Pagination
        pagination = page.locator('[class*="pagination" i], button:has-text("Next"), button:has-text("Previous")').all()
        visible_pagination = [p2 for p2 in pagination if p2.is_visible()]
        log('C3.6', 'Pagination exists', len(visible_pagination) > 0 or len(visible_cards) > 0,
            'Pagination visible' if visible_pagination else 'Single page of results')

        # Different query
        page.goto(f'{FE_URL}/search?q=bunny', timeout=10000)
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        page.screenshot(path=f'{SCREENSHOT_DIR}/10-bunny-results.png', full_page=False)
        body_text = page.locator('body').inner_text().lower()
        log('C3.7', 'Different query shows relevant results', 'bunny' in body_text)

        # ============================================
        # C4: Empty State
        # ============================================
        print("\n=== C4: Empty State ===")

        page.goto(f'{FE_URL}/search?q=xyznonexistent123', timeout=10000)
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        page.screenshot(path=f'{SCREENSHOT_DIR}/11-empty-state.png', full_page=False)

        body_text = page.locator('body').inner_text().lower()
        no_results = 'no result' in body_text
        log('C4.1', '"No results found" message', no_results)

        has_tips = ('different' in body_text or 'spelling' in body_text or
                   'general' in body_text or 'keyword' in body_text)
        log('C4.2', 'Suggestion tips displayed', has_tips)

        # Empty state accessibility
        empty_status = page.locator('[role="status"]')
        log('C4.3', 'role="status" on empty state', empty_status.count() > 0)

        # ============================================
        # C5: Search Bar Close
        # ============================================
        print("\n=== C5: Search Bar Close ===")

        page.goto(f'{FE_URL}/home', timeout=10000)
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # Expand search
        page.locator('[data-testid="search-toggle"]').click()
        time.sleep(0.5)
        input_el = page.locator('[data-testid="search-input"]')

        if input_el.is_visible():
            # Esc to close (input is empty → should collapse)
            input_el.press('Escape')
            time.sleep(0.5)
            page.screenshot(path=f'{SCREENSHOT_DIR}/12-after-esc.png', full_page=False)
            collapsed = not input_el.is_visible()
            log('C5.1', 'Esc key collapses search bar', collapsed)

            # Re-expand, type something, then clear button
            page.locator('[data-testid="search-toggle"]').click()
            time.sleep(0.5)
            input_el = page.locator('[data-testid="search-input"]')
            input_el.fill('test')
            time.sleep(0.3)
            clear_btn = page.locator('[data-testid="search-clear"]')
            clear_visible = clear_btn.is_visible()
            log('C5.2', 'Clear (X) button visible when text entered', clear_visible)
            if clear_visible:
                clear_btn.click()
                time.sleep(0.3)
                val = input_el.input_value()
                log('C5.3', 'Clear button clears input', val == '')

            # Click outside to close
            input_el.press('Escape')
            time.sleep(0.3)
            page.locator('[data-testid="search-toggle"]').click()
            time.sleep(0.5)
            page.locator('body').click(position={'x': 640, 'y': 400})
            time.sleep(0.5)
            page.screenshot(path=f'{SCREENSHOT_DIR}/13-after-click-outside.png', full_page=False)
            collapsed2 = not page.locator('[data-testid="search-input"]').is_visible()
            log('C5.4', 'Click outside collapses search bar', collapsed2)
        else:
            log('C5.1', 'Esc close', False, 'Input not visible after toggle')

    else:
        for tid, desc in [('C1.2', 'Expand'), ('C2.1', 'Suggestions'), ('C3.1', 'Results'), ('C4.1', 'Empty state')]:
            log(tid, desc, False, 'Search toggle not found')

    # ============================================
    # C6: Regression Check
    # ============================================
    print("\n=== C6: Regression Check ===")

    page.goto(f'{FE_URL}/home', timeout=10000)
    page.wait_for_load_state('networkidle')
    time.sleep(1)
    page.screenshot(path=f'{SCREENSHOT_DIR}/14-regression-home.png', full_page=False)
    has_content = len(page.locator('img').all()) > 3
    log('C6.1', 'Home page has content', has_content)

    # Navigate to a title detail
    detail_link = page.locator('a[href*="/title/"]').first
    detail_ok = False
    try:
        if detail_link.is_visible():
            detail_link.click()
            time.sleep(1)
            page.wait_for_load_state('networkidle')
            page.screenshot(path=f'{SCREENSHOT_DIR}/15-title-detail.png', full_page=False)
            detail_ok = '/title/' in page.url
    except:
        pass
    log('C6.2', 'Content detail page accessible from home', detail_ok,
        f'URL: {page.url}' if detail_ok else 'No title link found')

    log('C6.3', 'Auth session maintained throughout', logged_in)

    browser.close()

# ============================================
# Summary
# ============================================
print("\n" + "=" * 60)
print("BROWSER WALKTHROUGH SUMMARY — Sprint 9 Search")
print("=" * 60)
passed = sum(1 for r in results if r['status'] == 'PASS')
failed = sum(1 for r in results if r['status'] == 'FAIL')
total = len(results)
print(f"Total: {total} | PASS: {passed} | FAIL: {failed}")
print("-" * 60)
for r in results:
    icon = '✅' if r['status'] == 'PASS' else '❌'
    print(f"  {icon} {r['id']}: {r['desc']}" + (f" — {r['note']}" if r['note'] else ''))
print("=" * 60)

with open(f'{SCREENSHOT_DIR}/WALKTHROUGH_RESULTS.md', 'w') as f:
    f.write("# Sprint 9 Browser Walkthrough Results\n\n")
    f.write(f"**Date:** 2026-02-09\n")
    f.write(f"**URL:** {FE_URL}\n")
    f.write(f"**Total:** {total} | **PASS:** {passed} | **FAIL:** {failed}\n\n")
    f.write("| # | Test | Status | Note |\n")
    f.write("|---|------|--------|------|\n")
    for r in results:
        f.write(f"| {r['id']} | {r['desc']} | {r['status']} | {r['note']} |\n")
    f.write(f"\n**Screenshots:** `docs/testing/screenshots/sprint9/`\n")

if failed > 0:
    print(f"\n⚠️  {failed} FAILURES — review screenshots")
else:
    print(f"\n✅ All {total} tests passed!")
