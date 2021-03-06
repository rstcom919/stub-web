import React, { Component } from 'react';
import styles from './status-designer.module.scss';
import { getTemplates, deleteTemplate, updateTemplate, postTemplate } from '../../actions/templates';
import TemplateForm from '../status-template-form/template-form';
import {
  Grid,
  Row,
  Col,
  Button,
  Alert,
  DropdownButton,
  MenuItem,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  Table, FormControl, FormGroup
} from 'react-bootstrap';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faEllipsisV, faBell } from '@fortawesome/fontawesome-free-solid';
import { faCheckCircle } from '@fortawesome/fontawesome-free-regular';
import SavingSpinner from '../saving-spinner/saving-spinner';
import cx from 'classnames';
import { getErrorMessage } from '../../helpers/task';
import { getOrderedPriorityList } from '../../helpers/status-priority-order';
import { STATUS_DICT } from '../../helpers/status_dict';
import { toast } from 'react-toastify';

export default class StatusDesigner extends Component {
  constructor(props) {
    super(props);

    this.state = {
      templates: [],
      serverActionsIsPending: false,
      errorAlert: false,
      errorMessage: '',
      showCreateTemplateForm: false,
      successAlert: false,
      successMessage: '',
      profileInfo: null,
      templateActionPending: false,
      selectedTemplate: null,
      statuses:[],
    };

    this.getTemplates = this.getTemplates.bind(this);
    this.renderTemplates = this.renderTemplates.bind(this);
    this.showCreateForm = this.showCreateForm.bind(this);
    this.hideCreateForm = this.hideCreateForm.bind(this);
    this.onTemplateSave = this.onTemplateSave.bind(this);
    this.removeSuccessAlert = this.removeSuccessAlert.bind(this);
    this.removeErrorAlert = this.removeErrorAlert.bind(this);
    this.getProfileInfoForCompanyType = this.getProfileInfoForCompanyType.bind(this);
    this.onTemplateDelete = this.onTemplateDelete.bind(this);
    this.showErrorAlert = this.showErrorAlert.bind(this);
    this.serverAction = this.serverAction.bind(this);
    this.onMakeDefaultClick = this.onMakeDefaultClick.bind(this);
    this.onDeleteTemplateClick = this.onDeleteTemplateClick.bind(this);
    this.onDuplicateTemplateClick = this.onDuplicateTemplateClick.bind(this);
    this.handleSelectedTemplateFieldsChange = this.handleSelectedTemplateFieldsChange.bind(this);
    this.renderStatuses = this.renderStatuses.bind(this);
    this.savePriorities = this.savePriorities.bind(this);
    this.changeSameDayPriority = this.changeSameDayPriority.bind(this);
    this.changePriority = this.changePriority.bind(this);
    this.timeMileageForDifferentStatuses  =  this.timeMileageForDifferentStatuses.bind(this);
  }

  componentDidMount() {
    this.getTemplates();
    this.getProfileInfoForCompanyType();
  }

  removeSuccessAlert() {
    this.setState({
      successAlert: false,
      successMessage: ''
    });
  }

  showErrorAlert(alertMessage) {
    this.setState({
      errorAlert: true,
      errorMessage: alertMessage
    });
    setTimeout(() => {this.removeErrorAlert();}, 8000);
  }

  changeSameDayPriority(e, status) {
    e.preventDefault();
    e.stopPropagation();
    let status_priority = this.state.status_priority;
    status_priority[status].same_day = e.target.value;
    this.setState({ status_priority });
  }

  changePriority(e, status) {
    e.preventDefault();
    e.stopPropagation();
    let status_priority = this.state.status_priority;
    status_priority[status].priority = e.target.value;
    this.setState({ status_priority });
  }

  timeMileageForDifferentStatuses(e, status){
    e.preventDefault();
    e.stopPropagation();
    let status_priority = this.state.status_priority;
    if(e.target.value === 'true') {
      status_priority[status].time_mileage = true;
    } else{
      status_priority[status].time_mileage = false;
    }
    this.setState({ status_priority });
  }

  getProfileInfoForCompanyType() {
    this.props.getProfileInformation().then((info) => {
      let profileInfo = JSON.parse(info);
      this.setState({
        profileInfo,
        status_priority: profileInfo.status_priority
      });
    }).catch((err) => {
      const error = getErrorMessage(JSON.parse(err.responseText));
      this.setState({
        serverActionsIsPending: false
      }, () => {
        const alert = {
          text: error,
          options: {
            type: toast.TYPE.ERROR,
            position: toast.POSITION.BOTTOM_LEFT,
            className: styles.toastErrorAlert,
            autoClose: 8000
          }
        };
        this.props.createToastAlert(alert);
      });
    });
  }

  savePriorities(e) {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      serverActionsIsPending: true
    });
    this.props.updateProfileInformation({status_priority: JSON.stringify(this.state.status_priority)}).then((profile) => {
      const profileInfo = JSON.parse(profile);
      this.setState({
        profileInfo,
        status_priority: profileInfo.status_priority,
        serverActionsIsPending: false
      }, () => {
        const updated = {
          text: 'Successfully updated',
          options: {
            type: toast.TYPE.SUCCESS,
            position: toast.POSITION.BOTTOM_LEFT,
            className: styles.toastSuccessAlert,
            autoClose: 8000
          }
        };
        this.props.createToastAlert(updated);
      });
    }).catch((err) => {
      const error = getErrorMessage(JSON.parse(err.responseText));
      const failed = {
        text: error,
        options: {
          type: toast.TYPE.ERROR,
          position: toast.POSITION.BOTTOM_LEFT,
          className: styles.toastErrorAlert,
          autoClose: 8000
        }
      };
      this.props.createToastAlert(failed);
    });
  }

  removeErrorAlert() {
    this.setState({
      errorAlert: false,
      errorMessage: ''
    });
  }

  serverAction() {
    const templateAction = this.state.templateActionPending;
    this.setState({
      templateActionPending: !templateAction
    });
  }

  onTemplateSave(updated = false, duplicated = false) {
    let message = 'Template saved successfully';
    if (updated) {
      message = 'Template updated successfully.';
    } else if (duplicated) {
      message = 'Template duplicated successfully.';
    }
	  const alert = {
		  text: message,
		  options: {
			  type: toast.TYPE.SUCCESS,
			  position: toast.POSITION.BOTTOM_LEFT,
			  className: styles.toastSuccessAlert,
			  autoClose: 8000
		  }
	  };
	  this.props.createToastAlert(alert);
    this.getTemplates();
  }

  onTemplateDelete() {
	  const alert = {
		  text: 'Template deleted successfully.',
		  options: {
			  type: toast.TYPE.SUCCESS,
			  position: toast.POSITION.BOTTOM_LEFT,
			  className: styles.toastSuccessAlert,
			  autoClose: 8000
		  }
	  };
	  this.props.createToastAlert(alert);
    this.getTemplates();
  }

  getTemplates() {
    this.setState({ serverActionsIsPending: true });
    getTemplates().then((templates) => {
      this.setState({
        templates: JSON.parse(templates),
        serverActionsIsPending: false
      });
      this.renderTemplates();
    }).catch((err) => {
      this.setState({
        serverActionsIsPending: false
      }, () => {
	      const alert = {
		      text: 'Failed to update list. Server returned ' + err,
		      options: {
			      type: toast.TYPE.ERROR,
			      position: toast.POSITION.BOTTOM_LEFT,
			      className: styles.toastErrorAlert,
			      autoClose: 8000
		      }
	      };
	      this.props.createToastAlert(alert);
      });
    });
  }

  handleSelectedTemplateFieldsChange(updatedTemplate) {
    if (this.state.selectedTemplate !== null) {
      this.setState({
        selectedTemplate: updatedTemplate
      });
    } else {
      return;
    }
  }

  onMakeDefaultClick(e, template) {
    e.preventDefault();
    e.stopPropagation();
    this.serverAction();
    this.setState({
      selectedTemplate: template
    });
    const statuses = JSON.stringify(template.status_data);
    const custom_messages = JSON.stringify(template.custom_messages);
    updateTemplate(template.id, template.name, template.description, statuses, custom_messages, true,
      template.disable_auto_start_complete, template.auto_start_delay_time, template.auto_complete_delay_time,
      template.mark_enroute_after_complete, template.next_task_info).then(() => {
        this.serverAction();
        this.onTemplateSave(true);
      }).catch((err) => {
      this.serverAction();
    });
  }

  onDeleteTemplateClick(e, template) {
    e.preventDefault();
    e.stopPropagation();
    this.serverAction();
    this.setState({
      selectedTemplate: template
    });
    deleteTemplate(template.id).then((res) => {
      this.setState({
        errorAlert: false
      });
      this.onTemplateDelete();
      this.serverAction();
    }).catch((err) => {
      const error = JSON.parse(err.responseText);
      const errorMessage  = getErrorMessage(error);
	    const alert = {
		    text: errorMessage,
		    options: {
			    type: toast.TYPE.ERROR,
			    position: toast.POSITION.BOTTOM_LEFT,
			    className: styles.toastErrorAlert,
			    autoClose: 8000
		    }
	    };
	    this.props.createToastAlert(alert);
      this.serverAction();
    });
  }

  onDuplicateTemplateClick(e, template) {
    e.preventDefault();
    e.stopPropagation();
    this.serverAction();
    this.setState({
      selectedTemplate: template
    });
    const duplicateTemplate = {
      'name' : 'Copy of ' + template.name,
      'description' : template.description,
      'enabled' : true,
      'is_default' : false,
      'statuses': JSON.stringify(template.status_data),
      'custom_messages': JSON.stringify(template.custom_messages),
      'disable_auto_start_complete': template.disable_auto_start_complete,
      'auto_start_delay_time': template.auto_start_delay_time,
      'auto_complete_delay_time': template.auto_complete_delay_time,
      'mark_enroute_after_complete': template.mark_enroute_after_complete,
      'next_task_info': template.next_task_info,
    };
    postTemplate(duplicateTemplate).then((res) => {
      this.onTemplateSave(false, true);
      this.serverAction();
    }).catch((err) => {
      const error = JSON.parse(err.responseText);
      const errorMessage = getErrorMessage(error);
	    const alert = {
		    text: errorMessage,
		    options: {
			    type: toast.TYPE.ERROR,
			    position: toast.POSITION.BOTTOM_LEFT,
			    className: styles.toastErrorAlert,
			    autoClose: 8000
		    }
	    };
	    this.props.createToastAlert(alert);
      this.serverAction();
    });
  }

  showCreateForm(template = null) {
    this.setState({ showCreateTemplateForm: true, selectedTemplate: template });
  }

  hideCreateForm() {
    this.setState({ showCreateTemplateForm: false });
  }

  renderTemplates() {
    if (this.state.templates.length > 0) {
      let disableLinkClass = null;
      let disableRowClass = null;
      let disableAction = null;
      if (this.state.serverActionsIsPending || this.state.templateActionPending) {
        disableLinkClass = styles.disabledLink;
        disableRowClass = styles.disabledRow;
        disableAction = styles.disableAction;
      } else {
        disableLinkClass = '';
        disableRowClass = '';
        disableAction = '';
      }
      const templatesRendered = this.state.templates.map((template) => {
        if (template.type && template.type.toUpperCase() === 'TASK') {
          const templateDescription = template.description && (template.description.length < 250 ? template.description : template.description.substr(0, 250) + '...');
          return (
            <div className={styles.templateListItem}>
              <Row>
                <Col md={12}>
                  <Row className={disableRowClass}>
                    <Col md={5} sm={5} xs={12}>
                      <a className={cx(styles.singleTemplateTitle, disableLinkClass)}
                         onClick={() => this.showCreateForm(template)}>
                        {template.name}
                      </a>
                    </Col>
                    <Col md={7} sm={7} xs={12}>
                      {this.state.templateActionPending && template.id === this.state.selectedTemplate.id &&
                      <div className={styles.savingSpinnerContainer}>
                        <SavingSpinner title="" borderStyle="none" size={8}/>
                      </div>
                      }
                      <div className={styles.templateDescriptionContainer}>
                        {template.is_default ?
                          <span>{templateDescription}<strong>(DEFAULT TEMPLATE)</strong></span>
                          :
                          <span>{templateDescription}</span>
                        }
                      </div>
                      <div className={cx(styles.actionsBtnContainer, disableAction)}>
                        <DropdownButton title={(<FontAwesomeIcon icon={faEllipsisV}/>)} noCaret pullRight
                                        className={styles.actionsBtn} id="bg-nested-dropdown">
                          {!template.is_default &&
                          <MenuItem eventKey="1" onClick={(e) => this.onMakeDefaultClick(e, template)}>Make
                            Default</MenuItem>}
                          <MenuItem eventKey="2" onClick={(e) => this.onDuplicateTemplateClick(e, template)}>Duplicate
                            Template</MenuItem>
                          {!template.is_default &&
                          <MenuItem eventKey="3" onClick={(e) => this.onDeleteTemplateClick(e, template)}>Delete
                            Template</MenuItem>}
                        </DropdownButton>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          );
        }
      });
      return templatesRendered;
    } else {
      return (<p className="text-center">No templates found. Start by creating a <a className={styles.createMessageInline} onClick={() => this.showCreateForm()}>new template</a>.</p>);
    }
  }

  renderStatuses() {
    if (!this.state.status_priority) {
      return (
        <Row>
          <Col md={12} className="text-center">
            No statuses found.
          </Col>
        </Row>);
    }
    let statuses = [];
    const status_priority = getOrderedPriorityList(this.state.status_priority);
    for (status in status_priority) {
     let  new_status = status;
      statuses.push(
      <tr>
        <td><strong>{STATUS_DICT[status].label}</strong></td>
        <td>
          <FormGroup controlId="formControlsSelect" onChange={(e) => { this.changePriority(e, new_status) }} className={cx(styles.selectBox, styles[status_priority[status].priority.toLowerCase() + '-Priority'])}>
            <FontAwesomeIcon icon={faBell} />
            <FormControl componentClass="select" placeholder="select">
              <option className={styles['low-Priority']} value="LOW" selected={status_priority[status].priority.toUpperCase() === 'LOW'}>Low</option>
              <option className={styles['medium-Priority']} value="MEDIUM" selected={status_priority[status].priority.toUpperCase() === 'MEDIUM'}>Medium</option>
              <option className={styles['high-Priority']} value="HIGH" selected={status_priority[status].priority.toUpperCase() === 'HIGH'}>High</option>
              <option className={styles['urgent-Priority']} value="URGENT" selected={status_priority[status].priority.toUpperCase() === 'URGENT'}>Urgent</option>
            </FormControl>
          </FormGroup>
        </td>
        <td>
          <FormGroup controlId="formControlsSelect" onChange={(e) => { this.changeSameDayPriority(e, new_status) }} className={cx(styles.selectBox, styles[status_priority[status].same_day.toLowerCase() + '-Priority'])}>
            <FontAwesomeIcon icon={faBell} />
            <FormControl componentClass="select" placeholder="select">
              <option className={styles['low-Priority']} value="LOW" selected={status_priority[status].same_day.toUpperCase() === 'LOW'}>Low</option>
              <option className={styles['medium-Priority']} value="MEDIUM" selected={status_priority[status].same_day.toUpperCase() === 'MEDIUM'}>Medium</option>
              <option className={styles['high-Priority']} value="HIGH" selected={status_priority[status].same_day.toUpperCase() === 'HIGH'}>High</option>
              <option className={styles['urgent-Priority']} value="URGENT" selected={status_priority[status].same_day.toUpperCase() === 'URGENT'}>Urgent</option>
            </FormControl>
          </FormGroup>
        </td>
        <td>
          <FormGroup controlId="formControlsSelect" onChange={(e) => { this.timeMileageForDifferentStatuses(e, new_status)}}>
            <FormControl componentClass="select" placeholder="select">
              <option  value={ false } selected={status_priority[status].time_mileage === false}>No</option>
              <option  value={ true } selected={status_priority[status].time_mileage === true}>Yes</option>
            </FormControl>
          </FormGroup>
        </td>
      </tr>);
    }
    return(
      <Grid>
        <Row>
          <Col md={8} sm={12}>
            <div className={styles.statusPriorityTable}>
              <Table responsive hover striped>
                <thead>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Same-day Priority</th>
                  <th>Track time/mileage</th>
                </thead>
                <tbody>
                  {statuses}
                </tbody>
              </Table>
            </div>
          </Col>
          <Col md={4} sm={12}>
            <p>Status changes can be posted to the Job Journal, the Activity Stream, shown as notifications (desktop and mobile) and sent as Email.
            You can set the normal priority of these status changes as well as the priority when they occur during the same day as the job.</p>
            <ul className={styles.priorityNotations}>
              <li><strong className={styles['low-Priority']}>Low</strong> = Post in Job Journal</li>
              <li><strong className={styles['medium-Priority']}>Medium</strong> = Post in Job Journal and Activity Stream</li>
              <li><strong className={styles['high-Priority']}>High</strong> = Also post Desktop/Mobile notification</li>
              <li><strong className={styles['urgent-Priority']}>Urgent</strong> = Also send Email</li>
            </ul>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Button disabled={this.state.serverActionsIsPending || this.state.templateActionPending} onClick={(e) => this.savePriorities(e)} className={cx(['pull-right btn-submit'], styles.mT20, styles.saveBtn)}>
              {!this.state.raw_status_priority ? 'Save Changes' : <SavingSpinner title="" size={8} borderStyle="none" />}
            </Button>
          </Col>
        </Row>
      </Grid>
    );
  }

  render() {
    return (
      <Grid className={styles.statusDesignerWrapper}>
        <Row>
          <Col md={8} sm={8}>
            <h1 className={styles.header}>Templates & Statuses</h1>
            <p>Templates represent different types of tasks done by a business. You can customize customer messages and applicable statuses for each template. In case you have any questions please reach out to support@arrivy.com.</p>
          </Col>
          <Col md={4} sm={4}>
            <Button disabled={this.state.serverActionsIsPending || this.state.templateActionPending} onClick={() => this.showCreateForm()} type="submit" className={cx(['pull-right btn-submit'], styles.mT25)}>
              Add New Template
            </Button>
          </Col>
        </Row>
        {this.state.serverActionsIsPending &&
        <Row>
          <Col md={12}>
            <SavingSpinner title="Loading" borderStyle="none" size={8} />
          </Col>
        </Row>
        }
        {this.state.errorAlert &&
        <Row>
          <Col md={12}>
            <Alert bsStyle="danger">
              <h4><FontAwesomeIcon icon={faExclamationTriangle} /> Something went wrong!</h4>
              <p>{this.state.errorMessage}</p>
            </Alert>
          </Col>
        </Row>
        }
        {this.state.successAlert &&
        <Row>
          <Col md={12}>
            <Alert bsStyle="success">
              <h4><FontAwesomeIcon icon={faCheckCircle} /> Success!</h4>
              <p>{this.state.successMessage}</p>
            </Alert>
          </Col>
        </Row>
        }
        <Row>
          <Col md={12}>
            <div className={styles.statusTemplatesContainer}>
                <Tabs>
                    <Tab eventKey={1} tabClassName={styles.tabheader} title="TEMPLATES">
                        {this.renderTemplates()}
                    </Tab>
                    <Tab eventKey={2} tabClassName={styles.tabheader} title="STATUS SETTINGS">
                        {this.renderStatuses()}
                    </Tab>
                </Tabs>

            </div>
          </Col>
        </Row>
        <TemplateForm
          profile={this.state.profileInfo}
          showTemplateForm={this.state.showCreateTemplateForm}
          templateUpdated={this.onTemplateSave}
          hideTemplateForm={this.hideCreateForm}
          templateData={this.state.selectedTemplate}
          onFieldsChange={this.handleSelectedTemplateFieldsChange}
          createToastAlert={this.props.createToastAlert}
        />
      </Grid>
    );
  }
}
