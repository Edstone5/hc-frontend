import PropTypes from 'prop-types';
import NavButton from '@ui/NavButton';
import Tab from '@ui/Tab';

const Sidebar = ({ title, items }) => {
  return (
    <aside className="w-[280px] bg-[var(--color-primary-soft)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)] flex flex-col pt-5 min-h-0">
      <div className="top-[120px] absolute flex flex-row w-[280px]">
        <Tab isActive={true} name="hc">
          HISTORIA CLÍNICA
        </Tab>
      </div>

      <div className="bg-[var(--color-primary-soft)] px-[18px] py-[30px] text-center">
        <h2 className="!text-[var(--color-white)] text-2xl font-bold m-0">
          {title}
        </h2>
      </div>

      <nav
        className="px-[14px] pt-0 pb-[14px] flex flex-col gap-2.5 bg-transparent flex-1 min-h-0 overflow-y-auto"
        aria-label={`${title} navigation`}
      >
        {items.map((item, index) => (
          <NavButton key={index} to={item.path}>
            {item.label}
          </NavButton>
        ))}
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Sidebar;
